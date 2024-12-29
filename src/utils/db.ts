import { PrismaClient } from '@prisma/client';
import fs from "fs";
import path from "path";
import KlLogger from '../bot/logger';
import { Dates_GetFormatedDurationTimeFrom } from './dates';
import { Str_NormalizeLiteralString, Str_StringifyObj } from './strings';
import { KlTournament, ParticipantInfo, KlScheduledMatch_Player, TeamColor, KlTournamentEnhanced } from '../types/db';
import { AbstractTournament } from '../logic/TournamentTypos';
import TournamentsTypesSelector from '../logic';

//Expose main database
const Kldb = new PrismaClient();
export default Kldb


//------------------- Db Utils ------------------
// ============================ TOURNAMENTS =============================
export async function Db_DeleteTournamentById(tournamentId: number): Promise<boolean> {
  const tournament = await Kldb.tournament.findFirst({ where: { id: tournamentId } });
  if (!tournament) return false;

  if (tournament.cover_img_name) {
    try {
      fs.unlinkSync(path.join('db/tournaments_covers', tournament.cover_img_name));
    } catch (error) {
      KlLogger.error(`Failed to delete tournament cover: ${error}`);
      return false;
    }
  }

  try {
    await Kldb.tournament.delete({ where: { id: tournamentId } });
    return true;
  } catch (error) {
    KlLogger.error(`Failed to delete tournament: ${error}`);
    return false;
  }
}

export async function Db_GetTournamentFormattedInfo(tournamentId: number): Promise<string> {
  try {
    const selectedTournament = await Kldb.tournament.findFirstOrThrow({
      where: { id: tournamentId },
      include: {
        TournamentType: true,
        Tournament_Rank_RanksAdmitteds: {
          include: { Rank: true },
          orderBy: { Rank: { id: "asc" } }
        },
        Tournament_Player_Subscriptions: {
          include: { Player: { include: { Rank: true, Role: true } } },
          orderBy: { Player: { username: "asc" } }
        },
        MatchFormat: true
      }
    });
    const playersSubscribed = selectedTournament.Tournament_Player_Subscriptions;
    const admittedRanks = selectedTournament.Tournament_Rank_RanksAdmitteds;

    const imgCaptionInfo = `
      =🌟 *${selectedTournament.name.toUpperCase()}* 🌟=
      ${playersSubscribed.length < selectedTournament.max_players ? "✅ Abierto a inscripciones" : "❌ Cerrado"}
      ${selectedTournament.description}

      📊 Capacidad: ${playersSubscribed.length}/${selectedTournament.max_players}
      🎮 Tipo: ${selectedTournament.TournamentType.name}
      🦁 Modo de juego: ${selectedTournament.MatchFormat.name}
      ⌛ Días para jugar cada fase: ${selectedTournament.matchPeriodTime + (selectedTournament.matchPeriodTime === 1 ? " día" : " días")}
      🕒 Creado: ${Dates_GetFormatedDurationTimeFrom(selectedTournament.creationDate, { includingSeconds: true })}
      📅 Inicio: ${selectedTournament.beginDate ? Dates_GetFormatedDurationTimeFrom(selectedTournament.beginDate, { includingSeconds: true }) : "No ha iniciado todavía"}
      ⏳ Cierre: ${selectedTournament.endDate
        ? Dates_GetFormatedDurationTimeFrom(selectedTournament.endDate)
        : "⛔ Se sabrá al iniciar"}

      🏆 Rangos admitidos: 
      ${admittedRanks.length === 0
        ? "🎲 Todos los rangos permitidos"
        : admittedRanks.map(r => `🎯 ${Str_NormalizeLiteralString(r.Rank.name)}`).join("\n")}

      🔖 Inscritos: 
      ${playersSubscribed.length === 0
        ? "😔 Nadie todavía"
        : playersSubscribed.map(s => `🔹 ${s.Player.username} (${s.Player.Rank.name})`).join("\n")}
    `;

    return Str_NormalizeLiteralString(imgCaptionInfo);
  } catch (e) {
    return "No se pudo obtener la información del torneo...";
  }
}


export async function Db_InsertNewTournamentSubscription(subscriptionDateTimeUNIX: number, playerId: number, tournamentId: number): Promise<boolean> {
  try {
    await Kldb.tournament_Player_Subscriptions.create({
      data: {
        subscription_date: subscriptionDateTimeUNIX,
        player_id: playerId,
        tournament_id: tournamentId
      }
    })

    const tournamentInfo: KlTournamentEnhanced = await Kldb.tournament.findFirstOrThrow({ where: { id: tournamentId }, include: { Tournament_Player_Subscriptions: true, TournamentType: true, MatchFormat: true } });

    if (tournamentInfo.Tournament_Player_Subscriptions.length >= tournamentInfo.max_players) {
      const planner = TournamentsTypesSelector.get(tournamentInfo.tournament_type);
      if (!planner) throw new Error(`Tournament type ${tournamentInfo.tournament_type} not found, this shouldn't happen!`);
      const success = await Db_InsertNewFullTournamentPlanning(planner, tournamentInfo)
      return success;
    }

    return true;
  } catch (e) {
    KlLogger.error(`Failed to insert new tournament subscription inside Db_InsertNewTournamentSubscription: ${Str_StringifyObj(e)}`);
    return false;
  }
}

export async function Db_InsertNewFullTournamentPlanning(planner: AbstractTournament, tournamentInfo: KlTournamentEnhanced): Promise<boolean> {
  try {
    const participants: ParticipantInfo[] = await Kldb.tournament_Player_Subscriptions.findMany({
      where: { tournament_id: tournamentInfo.id },
      include: { Player: { include: { Rank: true, Role: true } } }
    });

    const fullPlanning = planner.CreateNextPhase(tournamentInfo, participants);

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

/**
 * TODO:
 * Terminar cachetournamentstarts
 * terminar inserttournamentplanngin into db
 *    terminar de actualizar el cache de los timers cuando se inserte en db
 * organizar este archivo dios santo!
 *    
 */


