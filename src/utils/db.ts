import { PrismaClient } from '@prisma/client';
import fs from "fs";
import path from "path";
import KlLogger from '../bot/logger';
import { Dates_GetFormatedDurationTimeFrom } from './dates';
import { Str_NormalizeLiteralString } from './strings';

//Expose main database
const Kldb = new PrismaClient();
export default Kldb


//------------------- Db Utils ------------------
export async function Db_DeleteTournamentById(tournamentId: number): Promise<boolean> {
  const tournament = await Kldb.tournament.findFirst({ where: { id: tournamentId } });
  if (!tournament) return false;

  if (tournament.cover_img_name) {
    try {
      fs.unlinkSync(path.join('db/tournaments_covers', tournament.cover_img_name));
    } catch (error) {
      KlLogger.error(`Failed to delete tournament cover: ${error}`);
      return false;
    }
  }

  try {
    await Kldb.tournament.delete({ where: { id: tournamentId } });
    return true;
  } catch (error) {
    KlLogger.error(`Failed to delete tournament: ${error}`);
    return false;
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
        },
        MatchFormat: true
      }
    });
    const playersSubscribed = selectedTournament.Tournament_Player_Subscriptions;
    const admittedRanks = selectedTournament.Tournament_Rank_RanksAdmitteds;

    const imgCaptionInfo = `
      =🌟 *${selectedTournament.name.toUpperCase()}* 🌟=
      ${Date.now() < selectedTournament.beginDate ? "✅ Abierto a inscripciones" : "❌ Cerrado"}
      ${selectedTournament.description}

      📊 Capacidad: ${playersSubscribed.length}/${selectedTournament.max_players}
      🎮 Tipo: ${selectedTournament.TournamentType.name}
      🦁 Modo de juego: ${selectedTournament.MatchFormat.name}
      ⌛ Días para jugar cada fase: ${selectedTournament.matchPeriodTime + (selectedTournament.matchPeriodTime === 1 ? " día" : " días")}
      🕒 Creado: ${Dates_GetFormatedDurationTimeFrom(selectedTournament.creationDate, { includingHours: true })}
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


