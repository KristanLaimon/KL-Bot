import { KlTournamentEnhanced, ParticipantInfo } from '../types/db';
import moment from "moment/moment";
import { ScheduledMatch, ScheduledMatchWindow } from "../types/tournament";

/**
 * Abstract class that represents a type of tournament.
 */
export abstract class GenericTournament {

  public static PlanNextPhaseMatches(fullTournamentInfo: KlTournamentEnhanced, participants: ParticipantInfo[]): ScheduledMatchWindow{
    let playersPerTeam = fullTournamentInfo.match_format === "CU" ? fullTournamentInfo.custom_players_per_team : fullTournamentInfo.MatchFormat.players_per_team;
    const numTeams = Math.floor(participants.length / playersPerTeam);
    const randomizedPlayers = participants.sort(() => Math.random() - 0.5);
    const randomizedTeams = new Array(numTeams).fill(0).map((_, index) => randomizedPlayers.slice(index * playersPerTeam, (index + 1) * playersPerTeam));
    const toReturn: ScheduledMatch[] = [];

    const perfectLogTwoPlanning = (teams:ParticipantInfo[][]) => {
      for (let i = 0; i < teams.length - 1; i++) {
        toReturn.push({
          MatchTypeId: fullTournamentInfo.match_format,
          Team1: teams[i].map(participantInfo => participantInfo.Player),
          Team2: teams[i + 1].map(participantInfo => participantInfo.Player)
        });
      }
    };

    if(isPositivePowerOfTwo(participants.length)) {
      perfectLogTwoPlanning(randomizedTeams)
    } else {
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

function GetRemindedCountByLogTwo(num:number){
  const log = Math.floor(Math.log2(num));
  const actualTwoPow = Math.pow(2, log);
  return num % actualTwoPow;
}

function isPositivePowerOfTwo(num:number):boolean{
  return num > 0 &&  Math.log2(num) % 1 === 0;
}







