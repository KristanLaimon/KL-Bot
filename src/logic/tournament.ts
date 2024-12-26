import { KlPlayer, KlTournament } from '../types/db';

type ScheduledMatch = {
  /*PlannedTimeWindows it belongs to ID PRIMARY KEY*/
  MatchTypeId: string; /* 1S for 1vs1 or 2S for 2vs2*/
  Team1: KlPlayer[];
  Team2: KlPlayer[];
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
  public abstract CreatePlanningFrom(fullTournamentInfo: KlTournament): TournamentSchedule;
}

class TournamentSingleElimination extends Tournament {
  public CreatePlanningFrom(fullTournamentInfo: KlTournament): TournamentSchedule {
    throw new Error('Method not implemented.');
  }
}

const TournamentsTypesSelector = new Map<string, Tournament>([
  ["SE", new TournamentSingleElimination()],
]);
export default TournamentsTypesSelector;

