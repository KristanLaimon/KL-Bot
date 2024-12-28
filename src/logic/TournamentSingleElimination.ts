import KlLogger from '../bot/logger';
import { KlTournament, ParticipantInfo } from '../types/db';
import { TournamentSchedule } from './TournamentTypos';

export abstract class AbstractTournament {
  public abstract CreatePlanningFrom(fullTournamentInfo: KlTournament, participants: ParticipantInfo[]): TournamentSchedule;
}

export class TournamentSingleElimination extends AbstractTournament {
  public CreatePlanningFrom(fullTournamentInfo: KlTournament, participants: ParticipantInfo[]): TournamentSchedule {
    //TODO: Start with this stuff
    KlLogger.error("TournamentSingleElimination has executed its planning method but not implemented yet");
    throw new Error('Method not implemented.');
  }
}