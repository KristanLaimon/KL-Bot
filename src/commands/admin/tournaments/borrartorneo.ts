import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from '../../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../../utils/dates';
import Kldb from '../../../utils/db';
import { Msg_DefaultHandleError } from '../../../utils/rawmsgs';
import { Response_isAfirmativeAnswer } from '../../../utils/responses';

export default class DeleteTournamentCommand implements ICommand {
  commandName: string = "borrartorneo";
  description: string = "Borra un torneo existente, no importa si ya ";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  helpMessage?: CommandHelpInfo = {
    structure: "borrartorneo",
    examples: [
      { text: "borrartorneo", isOk: true },
      { text: "borrartorneo algunargumentoextra", isOk: false }
    ],
    notes: "Borrará todos los registros relacionado con el torneo, no solamente los datos del torneo en sí mismo. Warning. Además se ocupa privilegios de administrador para ejecutar este comando"
  }
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    const hasFinalized = (milisecondsDate: number | null) => milisecondsDate !== null && Date.now() <= milisecondsDate;
    const isPending = (milisecondsDate: number | null) => milisecondsDate === null || Date.now() >= milisecondsDate;

    try {
      const allTournaments = await Kldb.tournament.findMany({
        include: {
          TournamentType: true
        }
      });

      const allTournamentsTxt = allTournaments
        .sort((t1, t2) => Math.sign(Number(t1.endDate) - Number(t2.endDate)))
        .map((t, i) => {
          const prefix = hasFinalized(Number(t.endDate)) ? "✅ Finalizado" : "⌚ Pendiente";
          return `${i + 1}. ${prefix} | ${t.name} | ${t.TournamentType.name} | Fecha de creación: ${Dates_GetFormatedDurationTimeFrom(t.creationDate)}`
        })
        .join("\n");

      await chat.SendTxt(`
        ====== 🏆 Torneos Registrados 🏆 =======
        ${allTournamentsTxt}
      `)

      const nonFinishedTournaments = allTournaments.filter(tournament => isPending(Number(tournament.endDate)));

      if (nonFinishedTournaments.length === 0) {
        await chat.SendTxt("No hay torneos pendientes todavía para borrar");
        return;
      }

      const selectedToDelete = await chat.DialogWaitAnOptionFromListObj(
        nonFinishedTournaments,
        (tournament, index) => (index + 1).toString(),
        "💡 Selecciona el torneo *pendiente* que deseas borrar escogiendo su número",
        "🚫 Número inválido 🚫\nEse número no corresponde a ningú torneo. Por favor, selecciona un número válido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄\n",
        (tournament, index) => `${index + 1}. ${tournament.name} | ${tournament.TournamentType.name} | Creado hace: ${Dates_GetFormatedDurationTimeFrom(tournament.creationDate)}`,
      )

      await chat.SendTxt(`
        Estás a punto de borrar toda la información del torneo, incluyendo:
        - Partidas planeadas
        - Partidas ya jugadas (Registro de los jugadores en el torneo)
        - Y todo relacionado con este torneo

        ¿Estas seguro de querer borrarlo? (si u ok para confirmar)
      `);
      const confirmation = Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(60));
      if (confirmation) {
        const justDeleted = await Kldb.tournament.delete({ where: { id: selectedToDelete.id } });
        await chat.SendTxt(`Torneo, todas sus partidas planeadas y partidas jugadas de este torneo exitosamente borrado: ${justDeleted.name}`);
      } else {
        await chat.SendTxt("Se ha cancelado el borrado del torneo, no ha pasado nada aquí...🐺");
      }

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}