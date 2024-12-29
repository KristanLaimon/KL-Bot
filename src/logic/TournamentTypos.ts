import { KlPlayer, KlTournament, KlTournamentEnhanced, ParticipantInfo } from '../types/db';

export abstract class AbstractTournament {
  public abstract CreateNextPhase(fullTournamentInfo: KlTournamentEnhanced, participants: ParticipantInfo[]): TournamentSchedule;
}

export type TournamentSchedule = {
  startDate: number; /*in Unix time*/
  endDate: number; /*in Unix time*/
  MatchWindows: ScheduledMatchWindow[];
}

export type ScheduledMatchWindow = {
  StartWindowDate: number, /*In unix time*/
  EndWindowDate: number, /*In unix time*/
  ScheduledMatches: ScheduledMatch[]
}

export type ScheduledMatch = {
  /*PlannedTimeWindows it belongs to ID PRIMARY KEY*/
  MatchTypeId: string; /* 1S for 1vs1 or 2S for 2vs2*/
  Team1: KlPlayer[];
  Team2: KlPlayer[];
}







