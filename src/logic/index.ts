import { TournamentSingleElimination } from './TournamentSingleElimination';
import { AbstractTournament } from './TournamentTypos';

const TournamentsTypesSelector = new Map<string, AbstractTournament>([
  ["SE", new TournamentSingleElimination()],
]);
export default TournamentsTypesSelector;