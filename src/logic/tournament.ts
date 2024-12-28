import KlLogger from '../bot/logger';
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

export abstract class AbstractTournament {
  public abstract CreatePlanningFrom(fullTournamentInfo: KlTournament): TournamentSchedule;
}

export class TournamentSingleElimination extends AbstractTournament {
  public CreatePlanningFrom(fullTournamentInfo: KlTournament): TournamentSchedule {
    KlLogger.error("TournamentSingleElimination has executed its planning method but not implemented yet");
    throw new Error('Method not implemented.');
  }
}

const TournamentsTypesSelector = new Map<string, AbstractTournament>([
  ["SE", new TournamentSingleElimination()],
]);
export default TournamentsTypesSelector;

