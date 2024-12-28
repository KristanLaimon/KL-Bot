import { KlPlayer, KlTournament, ParticipantInfo } from '../types/db';
import { AbstractTournament, TournamentSingleElimination } from './TournamentSingleElimination';

const TournamentsTypesSelector = new Map<string, AbstractTournament>([
  ["SE", new TournamentSingleElimination()],
]);
export default TournamentsTypesSelector;
export type ScheduledMatch = {
  /*PlannedTimeWindows it belongs to ID PRIMARY KEY*/
  MatchTypeId: string; /* 1S for 1vs1 or 2S for 2vs2*/
  Team1: KlPlayer[];
  Team2: KlPlayer[];
}

export type ScheduledMatchWindow = {
  StartWindowDate: number, /*In unix time*/
  EndWindowDate: number, /*In unix time*/
  ScheduledMatches: ScheduledMatch[]
}

export type TournamentSchedule = {
  startDate: number; /*in Unix time*/
  endDate: number; /*in Unix time*/
  MatchWindows: ScheduledMatchWindow[];
}





