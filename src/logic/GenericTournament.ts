import { KlTournamentEnhanced, KlSubscriptionEnhanced } from '../types/db';
import moment from "moment/moment";
import { ScheduledMatch, ScheduledMatchWindow } from "../types/tournament";
import KlLogger from "../bot/logger";

function shuffle<T>(array: T[]): T[] {
  const toReturn = structuredClone(array);
  for (let i = toReturn.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [toReturn[i], toReturn[j]] = [toReturn[j], toReturn[i]];
  }
  return toReturn;
}

/**
 * Abstract class that represents a type of tournament.
 */
export abstract class GenericTournament {

  public static PlanNextPhaseMatches(fullTournamentInfo: KlTournamentEnhanced, participants: KlSubscriptionEnhanced[]): ScheduledMatchWindow {
    //Check if it's a custom match or a normal one
    let playersPerTeam = fullTournamentInfo.custom_players_per_team !== -1 ? fullTournamentInfo.custom_players_per_team : fullTournamentInfo.MatchFormat.players_per_team;
    if (playersPerTeam === -1) throw new Error("Custom players per team not correctly implemented");
    const numTeams = Math.floor(participants.length / playersPerTeam);
    const randomizedPlayers = shuffle(participants);
    const randomizedTeams = new Array(numTeams).fill(0).map((_, index) => randomizedPlayers.slice(index * playersPerTeam, (index + 1) * playersPerTeam));

    if (randomizedTeams.length === 0 || randomizedTeams.length === 1) {
      throw new Error(`Can't plan a tournament with less than 2 teams. There are ${randomizedTeams.length} teams and received ${participants.length} players`);
    }

    const toReturn: ScheduledMatch[] = [];

    const perfectLogTwoPlanning = (teams: KlSubscriptionEnhanced[][]) => {
      //Equipos de 2 en 2
      for (let i = 0; i < teams.length - 1; i += 2) {
        toReturn.push({
          MatchTypeId: fullTournamentInfo.match_format,
          Team1: teams[i].map(participantInfo => participantInfo.Player),
          Team2: teams[i + 1].map(participantInfo => participantInfo.Player)
        });
      }
    };

    if (isPositivePowerOfTwo(randomizedTeams.length)) {
      perfectLogTwoPlanning(randomizedTeams)
    } else {
      KlLogger.error("For some reason, the number of teams is not a power of 2, when doing the planning!");
      const leftOversCount = GetRemindedCountByLogTwo(randomizedTeams.length);
      const leftOvers = randomizedTeams.splice((randomizedTeams.length - 1) - leftOversCount, leftOversCount);
      perfectLogTwoPlanning(randomizedTeams);
    }

    return {
      StartDate: Date.now(),
      EndDate: moment().add(fullTournamentInfo.matchPeriodTime, 'days').valueOf(),
      ScheduledMatches: toReturn
    }
  }
}

function GetRemindedCountByLogTwo(num: number) {
  const log = Math.floor(Math.log2(num));
  const actualTwoPow = Math.pow(2, log);
  return num % actualTwoPow;
}

function isPositivePowerOfTwo(num: number): boolean {
  return num > 0 && Math.log2(num) % 1 === 0;
}

function LogInBase(number: number, base: number) {
  return Math.log(number) / Math.log(base);
}






