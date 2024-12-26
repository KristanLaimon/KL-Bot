import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, ScopeType } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import Kldb from '../../utils/db';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import { Str_NormalizeLiteralString } from '../../utils/strings';

export default class SeeTournamentsCommand implements ICommand {
  commandName: string = "torneos";
  description: string = "Ver todos los torneos creados habidos y por haber con filtros";
  maxScope: ScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const allTournaments = await Kldb.tournament.findMany({ include: { TournamentType: true } });

      if (allTournaments.length === 0) {
        await chat.SendTxt("No hay torneos creados todavía...");
        return;
      }

      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        allTournaments,
        (tournament, index) => (index + 1).toString(),
        "====== 🏆 Torneos Creados 🏆 ======\n\n💡 Selecciona el torneo que deseas ver a detalle escogiendo su número",
        "🚫 Número inválido 🚫\nEse número no corresponde a ningún torneo. Por favor, selecciona un número válido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄\n\n",
        (tournament, index) => `${index + 1}. ${tournament.name} | ${tournament.TournamentType.name} | Creado hace: ${Dates_GetFormatedDurationTimeFrom(tournament.creationDate)}`,
        60
      );

      const admittedRanks = await Kldb.tournament_Rank_RanksAdmitted.findMany({
        where: { tournament_id: selectedTournament.id },
        include: { Rank: true }
      });

      const playersSubscribed = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { tournament_id: selectedTournament.id },
        include: { Player: { include: { Rank: true } } } //It's a 'join', omg

      })

      const imgCaptionInfo = `
        🌟====== **${selectedTournament.name.toUpperCase()}** ======🌟

        📖 *Descripción:* ${selectedTournament.description}

        🎮 *Tipo de torneo:* ${selectedTournament.TournamentType.name}

        🕒 *Creado hace:* ${Dates_GetFormatedDurationTimeFrom(selectedTournament.creationDate)}

        📅 *Fecha de inicio:* ${Dates_GetFormatedDurationTimeFrom(selectedTournament.beginDate)}

        ⏳ *Fecha de cierre:* ${selectedTournament.endDate
          ? Dates_GetFormatedDurationTimeFrom(selectedTournament.endDate)
          : "⛔ No hay suficientes participantes para determinarlo o no ha iniciado el torneo todavía"}

        ⌛ *Duración de cada ventana de juego:* ${selectedTournament.matchPeriodTime} días

        🏆 *Rangos admitidos:* ${admittedRanks.length === 0 ? "🎲 Todos los rangos permitidos"
          : admittedRanks.map(range => `🎯 ${Str_NormalizeLiteralString(range.Rank.name)}`).join(", ")}

        📝 *Abierto a inscripciones:* ${Date.now() < selectedTournament.beginDate ? "✅ Sí" : "❌ No"}

        👥 *Cantidad máxima de jugadores:* ${selectedTournament.max_players}

        📊 *Capacidad actual:* ${playersSubscribed.length}/${selectedTournament.max_players}

        🔖 *Jugadores inscritos:* ${playersSubscribed.length === 0
          ? "😔 Nadie se ha inscrito todavía"
          : playersSubscribed.map(subscription => `🔹 ${subscription.Player.username} | ${subscription.Player.Rank.name}`).join("\n")}
      `;

      await chat.SendImg(`db/tournaments_covers/${selectedTournament.cover_img_name}`, imgCaptionInfo);

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }

  }
}