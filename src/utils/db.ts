import fs, { Dirent } from "fs"
import path from "path"
import { PrismaClient } from '@prisma/client';
import { KlGetTableType, KlScheduledMatchWindow, KlTournament, PendingMatch, PendingTournamentStart } from '../types/db';
import TournamentsTypesSelector, { AbstractTournament } from '../logic/typos';
import KlLogger from '../bot/logger';
import { Dates_GetFormatedDurationTimeFrom } from './dates';
import { Str_NormalizeLiteralString } from './strings';

//Expose main database
const Kldb = new PrismaClient();
export default Kldb


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
        Tournament_Rank_RanksAdmitteds: {
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
    const admittedRanks = selectedTournament.Tournament_Rank_RanksAdmitteds;

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


