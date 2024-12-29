import KlLogger from '../bot/logger';
import { KlTournamentEnhanced, ParticipantInfo } from '../types/db';
import { AbstractTournament, TournamentSchedule } from './TournamentTypos';

export class TournamentSingleElimination extends AbstractTournament {
  public CreateNextPhase(fullTournamentInfo: KlTournamentEnhanced, participants: ParticipantInfo[]): TournamentSchedule {
    //TODO: Start with this stuff
    let playersPerTeam = fullTournamentInfo.MatchFormat.players_per_team;
    if (fullTournamentInfo.tournament_type == "CU") playersPerTeam = fullTournamentInfo.custom_players_per_team;

    const numTeams = Math.ceil(participants.length / playersPerTeam);
    const numRounds = Math.ceil(Math.log2(numTeams));
    const numMatches = numRounds * (numTeams - 1);
    //TODO: finish this

    KlLogger.error("TournamentSingleElimination has executed its planning method but not implemented yet");
    throw new Error('Method not implemented.');
  }
}