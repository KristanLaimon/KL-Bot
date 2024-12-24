import Kldb from '../utils/db';

export const TournamentTypes = new Map<string, Tournament>([
  // ["SE", new Tournament()],
]);

type Player = NonNullable<Awaited<ReturnType<typeof Kldb.player.findFirst>>>

type ScheduledMatch = {
  /*PlannedTimeWindows it belongs to ID PRIMARY KEY*/
  MatchTypeId: string; /* 1S for 1vs1 or 2S for 2vs2*/
  Team1: Player[];
  Team2: Player[];
}

type ScheduledMatchWindow = {
  StartWindowDate: number, /*In unix time*/
  EndWindowDate: number, /*In unix time*/
  ScheduledMatches: ScheduledMatch[]
}

type TournamentSchedule = {
  startDate: number; /*in Unix time*/
  endDate: number; /*in Unix time*/
  MatchWindows: ScheduledMatchWindow[];
}

abstract class Tournament {
  public abstract CreatePlanning();

}
