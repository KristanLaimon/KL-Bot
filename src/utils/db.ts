import fs, { Dirent } from "fs"
import path from "path"
import { PrismaClient } from '@prisma/client';
import { KlGetTableType, KlScheduledMatchWindow, KlTournament, PendingMatch, PendingTournamentStart } from '../types/db';
import TournamentsTypesSelector, { AbstractTournament } from '../logic/tournament';
import KlLogger from '../bot/logger';
import { Dates_GetFormatedDurationTimeFrom } from './dates';
import { Str_NormalizeLiteralString } from './strings';

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

  const allTournaments = await Kldb.tournament.findMany();
  const toReturn: PendingTournamentStart[] = [];

  for (const tournament of allTournaments) {
    const diffTimeMiliseconds = Number(tournament.beginDate) - Date.now();
    const tournamentPlanner = TournamentsTypesSelector.get(tournament.tournament_type);

    //If it hasn't started yet 
    if (diffTimeMiliseconds >= 0) {
      const timer = setTimeout(() => {
        Db_InsertTournamentPlanningIntoDb(tournamentPlanner, tournament);

      }, diffTimeMiliseconds);
      toReturn.push({ tournamentInfo: tournament, countdownTimer: timer });
    }
    //It has already started but not finished yet
    else if (diffTimeMiliseconds > 0 && tournament.endDate > Date.now()) {
      try {
        const hasAtLeastSomePlanning = await Kldb.scheduledMatchWindow.findFirst({
          where: { tournament_id: tournament.id }
        })
        //If has started but not planned already
        if (hasAtLeastSomePlanning === null) {
          Db_Inser
        }
        else {
          //It has already started and has planning, so do nothing
        }
      } catch (e) {
        KlLogger.error(`Error creating timer for a started but not planned tournament ${tournament.name}: ${JSON.stringify(e, null, 0)}`);
      }
    }
    else {
      //It has already started and finished, so do nothing
    }



  }
  // return toReturn;
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

export async function Db_GetTournamentFormattedInfo(tournamentId: number): Promise<string> {
  try {
    const selectedTournament = await Kldb.tournament.findFirstOrThrow({
      where: { id: tournamentId },
      include: {
        TournamentType: true,
        Tournament_Rank_RanksAdmitted: {
          include: { Rank: true },
          orderBy: { Rank: { id: "asc" } }
        },
        Tournament_Player_Subscriptions: {
          include: { Player: { include: { Rank: true, Role: true } } },
          orderBy: { Player: { username: "asc" } }
        }
      }
    });
    const playersSubscribed = selectedTournament.Tournament_Player_Subscriptions;
    const admittedRanks = selectedTournament.Tournament_Rank_RanksAdmitted;

    const imgCaptionInfo = `
      =🌟 *${selectedTournament.name.toUpperCase()}* 🌟=
      📖 ${selectedTournament.description}
      👥 Máx. jugadores: ${selectedTournament.max_players}
      📊 Capacidad: ${playersSubscribed.length}/${selectedTournament.max_players}
      🎮 Tipo: ${selectedTournament.TournamentType.name}
      📝 Inscripciones: ${Date.now() < selectedTournament.beginDate ? "✅ Sí" : "❌ No"}
      ⌛ Duración de la ventana de juego: ${selectedTournament.matchPeriodTime + (selectedTournament.matchPeriodTime === 1 ? " día" : " días")}
      🕒 Creado: ${Dates_GetFormatedDurationTimeFrom(selectedTournament.creationDate)}
      📅 Inicio: ${Dates_GetFormatedDurationTimeFrom(selectedTournament.beginDate, { includingSeconds: true })}
      ⏳ Cierre: ${selectedTournament.endDate
        ? Dates_GetFormatedDurationTimeFrom(selectedTournament.endDate)
        : "⛔ Se sabrá al iniciar"}

      🏆 Rangos admitidos: 
      ${admittedRanks.length === 0
        ? "🎲 Todos los rangos permitidos"
        : admittedRanks.map(r => `🎯 ${Str_NormalizeLiteralString(r.Rank.name)}`).join("\n")}

      🔖 Inscritos: 
      ${playersSubscribed.length === 0
        ? "😔 Nadie todavía"
        : playersSubscribed.map(s => `🔹 ${s.Player.username} (${s.Player.Rank.name})`).join("\n")}
    `;

    return Str_NormalizeLiteralString(imgCaptionInfo);
  } catch (e) {
    return "No se pudo obtener la información del torneo...";
  }
}

/**
 * TODO:
 * Terminar cachetournamentstarts
 * terminar inserttournamentplanngin into db
 *    terminar de actualizar el cache de los timers cuando se inserte en db
 * organizar este archivo dios santo!
 *    
 */

async function UpdateTournamentPlanning(planner: AbstractTournament, tournamentInfo: KlTournament) {
  await Db_InsertTournamentPlanningIntoDb(planner, tournamentInfo);

}

export async function Db_InsertTournamentPlanningIntoDb(planner: AbstractTournament, tournamentInfo: KlTournament): Promise<boolean> {
  try {

    const fullSchema = planner.CreatePlanningFrom(tournamentInfo);

    //Update tournament endDate
    await Kldb.tournament.update({
      where: { id: tournamentInfo.id },
      data: {
        endDate: fullSchema.endDate
      }
    });

    // for (const scheduled)

    const scheduledWindowsToInsert: KlScheduledMatchWindow[] =
      fullSchema.MatchWindows.map(mw => ({
        id: undefined,
        starting_date: BigInt(mw.StartWindowDate),
        ending_date: BigInt(mw.EndWindowDate),
        tournament_id: tournamentInfo.id
      }));


    // for (const scheduledMatch of scheduledWin)





  } catch (e) {
    KlLogger.error(`Couldn't plan tournament nor update it (maybe) in db: ${JSON.stringify(e, null, 0)}`);
    return false;
  }
}

function DeleteTimer() {

}