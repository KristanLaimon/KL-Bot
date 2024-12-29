import { TournamentSingleElimination } from './TournamentSingleElimination';
import { GenericTournament } from './GenericTournament';

const TournamentsTypesSelector = new Map<string, GenericTournament>([
  ["SE", new TournamentSingleElimination()],
]);
export default TournamentsTypesSelector;