import fs, { Dirent } from "fs"
import path from "path"
import { PrismaClient } from '@prisma/client';
import { PendingMatch, PendingTournamentStart } from '../types/db';
import TournamentsTypesSelector from '../logic/tournament';
import KlLogger from '../bot/logger';
import moment from 'moment';

//Expose main database
const Kldb = new PrismaClient();
export default Kldb

// ---------------- In RAM Db ------------------------
export const Kldb_Ram_PendingMatches: PendingMatch[] = [];

// ------------------ In RAM STARTUP Cache ------------------------
export let Kldb_Ram_PendingTournamentsTimers: PendingTournamentStart[] = [];
export let KldbCacheAllowedWhatsappGroups: NonNullable<Awaited<ReturnType<typeof Kldb.registeredWhatsappGroups.findFirst>>>[] = [];

export async function Kldb_UpdateStartupCacheAsync() {
  KldbCacheAllowedWhatsappGroups = await Kldb.registeredWhatsappGroups.findMany();
  Kldb_Ram_PendingTournamentsTimers = await CacheTournamentsStarts();
}

// -------------------- Cache Helpers --------------------
/**
 * Returns all the tournaments that are about to start and creates a timer for each one of them.
 * The timer is set to fire when the tournament starts, and when it does, it calls the
 * CreatePlanningFrom function of the corresponding tournament planner.
 *
 * For example, if the current time is 2022-01-01 12:00:00 and we have two tournaments:
 * - One with beginDate set to 2022-01-01 12:10:00
 * - Another with beginDate set to 2022-01-01 12:20:00
 *
 * Then, this function will return an array with two elements, each one containing the
 * tournament info and a timer. The first timer will fire in 10 minutes, and the second
 * one will fire in 20 minutes.
 * @returns {Promise<PendingTournamentStart[]>} An array of PendingTournamentStart objects, each one containing the tournament info and a timer.
 */
async function CacheTournamentsStarts(): Promise<PendingTournamentStart[]> {
  Kldb_Ram_PendingTournamentsTimers.splice(0, Kldb_Ram_PendingTournamentsTimers.length);

  const pendingTournaments = await Kldb.tournament.findMany({
    where: { beginDate: { gt: Date.now() } }
  });

  const toReturn: PendingTournamentStart[] = [];
  for (const tournament of pendingTournaments) {
    const diffTimeMiliseconds = Number(tournament.beginDate) - Date.now();
    // const debugging = moment.duration(diffTimeMiliseconds);
    const tournamentPlanner = TournamentsTypesSelector.get(tournament.tournament_type);
    const timer = setTimeout(() => tournamentPlanner.CreatePlanningFrom(tournament), diffTimeMiliseconds);
    toReturn.push({ tournamentInfo: tournament, countdownTimer: timer });
  }
  return toReturn;
}


//------------------- Db Utils ------------------
export async function Db_DeleteTournamentById(tournamentId: number): Promise<boolean> {
  const tournamentInfo = await Kldb.tournament.findFirst({ where: { id: tournamentId } });
  if (!tournamentInfo) return false;

  let allFilesInfo: Dirent[] = [];
  try {
    allFilesInfo = fs.readdirSync('db/tournaments_covers', { withFileTypes: true });
  } catch (e) {
    KlLogger.error(`Error deleting tournament cover: ${e}`);
    return false;
  }

  for (const fileInfo of allFilesInfo) {
    const parts = fileInfo.name.split('-');
    if (parts[0] === tournamentInfo.name || parts[1] == Number(tournamentInfo.beginDate).toString()) {
      try {
        fs.unlinkSync(path.join(fileInfo.parentPath, fileInfo.name));
        await Kldb.tournament.delete({ where: { id: tournamentId } });
        return true
      } catch (e) {
        KlLogger.error(`Error deleting tournament cover: ${e}`);
        return false;
      }
    }
  }
}

