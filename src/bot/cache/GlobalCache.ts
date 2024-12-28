import TournamentsTypesSelector, { AbstractTournament } from '../../logic/TournamentTypos';
import { KlScheduledMatch_Player, KlTournament, ParticipantInfo, PendingMatch, PendingTournamentStart, TeamColor } from '../../types/db';
import Kldb from '../../utils/db';
import KlLogger from '../logger';

export default class GlobalCache {
  // ---------------- Automatic Cache ------------------------
  // No need to handle it with UpdateCache(), it works by itself
  public static Auto_PendingMatches: PendingMatch[] = [];

  constructor() { throw new Error("Cache class is not meant to be instantiated, is static class!") }

  // ------------------ SemiAutomatic ------------------------
  // Needs to be updated with UpdateCache()
  public static SemiAuto_PendingTournamentsTimers: PendingTournamentStart[] = [];
  public static SemiAuto_AllowedWhatsappGroups: NonNullable<Awaited<ReturnType<typeof Kldb.registeredWhatsappGroups.findFirst>>>[] = [];

  public static async UpdateCache() {
    this.SemiAuto_AllowedWhatsappGroups = await Kldb.registeredWhatsappGroups.findMany();
    this.ClearTimers();
    this.SemiAuto_PendingTournamentsTimers = await this.CacheNoStartedTournamentTimers();
    await this.PlanLeftoversTournaments();
  }

  private static ClearTimers() {
    if (this.SemiAuto_PendingTournamentsTimers.length === 0) return;
    for (const info of this.SemiAuto_PendingTournamentsTimers) {
      clearTimeout(info.countdownTimer);
    }
    this.SemiAuto_PendingTournamentsTimers.splice(0, this.SemiAuto_PendingTournamentsTimers.length);
  }

  /**
   * Returns all the tournaments that are about to start and creates a timer for each one of them.
   * The timer is set to fire when the tournament starts, and when it does, it calls the
   * CreatePlanningFrom function of the corresponding tournament planner.
   *
   * For example, if the current time is 2022-01-01 12:00:00 and we have two tournaments:
   * - One with beginDate set to 2022-01-01 12:10:00
   * - Another with beginDate set to 2022-01-01 12:20:00
   *
   * Then, this function will return an array with two elements, each one containing the
   * tournament info and a timer. The first timer will fire in 10 minutes, and the second
   * one will fire in 20 minutes.
   * @returns {Promise<PendingTournamentStart[]>} An array of PendingTournamentStart objects, each one containing the tournament info and a timer.
   */
  private static async CacheNoStartedTournamentTimers(): Promise<PendingTournamentStart[]> {
    this.SemiAuto_PendingTournamentsTimers.splice(0, this.SemiAuto_PendingTournamentsTimers.length);
    const allTournaments = await Kldb.tournament.findMany({
      where: { beginDate: { gte: Date.now() } }
    });

    //Some javascript issues...
    const InsertPlanningToDb: typeof this.Db_InsertTournamentPlanningIntoDb = this.Db_InsertTournamentPlanningIntoDb.bind(this);

    const toReturn: PendingTournamentStart[] = [];
    for (const tournament of allTournaments) {
      const diffTimeMiliseconds = Number(tournament.beginDate) - Date.now();
      const tournamentPlanner = TournamentsTypesSelector.get(tournament.tournament_type);
      const timer = setTimeout(async () => {
        await InsertPlanningToDb(tournamentPlanner, tournament);
        //CAN'T BE -1
        const index = this.SemiAuto_PendingTournamentsTimers.findIndex(t => t.tournamentInfo.id === tournament.id);
        if (index !== -1) {
          KlLogger.error(`Tournament timer ${tournament.id} not removed from SemiAuto_PendingTournamentsTimers, for some reason!, FIX THIS`);
          return;
        }
        this.SemiAuto_PendingTournamentsTimers.splice(index, 1);
      }, diffTimeMiliseconds);
      toReturn.push({ tournamentInfo: tournament, countdownTimer: timer });
    }
    return toReturn;
  }

  private static async PlanLeftoversTournaments() {
    // Tournaments that have already started but not finished yet and with no planning 
    // Edge Case: (Bot was turned off when the tournament started)
    try {
      const alreadyStartedTournaments = await Kldb.tournament.findMany({
        where: { AND: [{ beginDate: { lte: Date.now() } }, { endDate: { gte: Date.now() } }] },
        include: { ScheduledMatchWindows: true }
      })

      for (const tournament of alreadyStartedTournaments) {
        const tournamentPlanner = TournamentsTypesSelector.get(tournament.tournament_type);
        if (tournament.ScheduledMatchWindows.length === 0) {
          await this.Db_InsertTournamentPlanningIntoDb(tournamentPlanner, tournament);
        }
      }
    } catch (e) {
      KlLogger.error(`Error planning leftovers tournaments: ${JSON.stringify(e)}`);
    }
  }

  private static async Db_InsertTournamentPlanningIntoDb(planner: AbstractTournament, tournamentInfo: KlTournament): Promise<boolean> {
    try {
      const participants: ParticipantInfo[] = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { tournament_id: tournamentInfo.id },
        include: { Player: { include: { Rank: true, Role: true } } }
      });

      const fullPlanning = planner.CreatePlanningFrom(tournamentInfo, participants);

      //Update tournament endDate
      await Kldb.tournament.update({
        where: { id: tournamentInfo.id },
        data: {
          endDate: fullPlanning.endDate
        }
      });

      //Most optimized possible..
      const scheduledMatch_PlayersToInsert: KlScheduledMatch_Player[] = [];

      for (const mw of fullPlanning.MatchWindows) {
        const fullCreatedMW = await Kldb.scheduledMatchWindow.create({
          data: {
            starting_date: BigInt(mw.StartWindowDate),
            ending_date: BigInt(mw.EndWindowDate),
            tournament_id: tournamentInfo.id
          }
        });

        for (const sm of mw.ScheduledMatches) {
          const fullCreatedSM = await Kldb.scheduledMatch.create({
            data: {
              match_type: sm.MatchTypeId,
              scheduled_match_window_id: fullCreatedMW.id
            }
          })

          const zeroOrOne = Math.round(Math.random());
          const teamColorId1: string = zeroOrOne === 0 ? TeamColor.Blue : TeamColor.Orange;
          const teamColorId2: string = !(zeroOrOne === 0) ? TeamColor.Blue : TeamColor.Orange;

          for (const p of sm.Team1) {
            scheduledMatch_PlayersToInsert.push({
              player_id: p.id,
              team_color_id: teamColorId1,
              scheduled_match_id: fullCreatedSM.scheduled_match_window_id
            })
          }

          for (const p of sm.Team2) {
            scheduledMatch_PlayersToInsert.push({
              player_id: p.id,
              team_color_id: teamColorId2,
              scheduled_match_id: fullCreatedSM.scheduled_match_window_id
            })
          }

          await Kldb.scheduledMatch_Player.createMany({
            data: scheduledMatch_PlayersToInsert
          });
        }
      }
      return true;
    } catch (e) {
      KlLogger.error(`Couldn't plan tournament nor update it (maybe) in db: ${JSON.stringify(e, null, 0)}`);
      return false;
    }
  }


}