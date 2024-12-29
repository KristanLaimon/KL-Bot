import { KlPlayer } from "./db";

export type ScheduledMatchWindow = {
  StartDate: number, /*In unix time*/
  EndDate: number, /*In unix time*/
  ScheduledMatches: ScheduledMatch[]
}

export type ScheduledMatch = {
  /*PlannedTimeWindows it belongs to ID PRIMARY KEY*/
  MatchTypeId: string; /* 1S for 1vs1 or 2S for 2vs2*/
  Team1: KlPlayer[];
  Team2: KlPlayer[];
}
