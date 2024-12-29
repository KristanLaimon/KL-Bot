import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import { Dates_GetFormatedDurationTimeFrom } from "../../utils/dates";
import Kldb, {
  Db_GetStandardInfoPlayerFromMention,
  Db_GetStandardInfoPlayerFromRawMsg,
  Db_InsertNewTournamentSubscription
} from "../../utils/db";
import { Phone_IsAMentionNumber } from "../../utils/phonenumbers";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import { Response_isAfirmativeAnswer } from "../../utils/responses";

export default class EnterToTournamentCommand implements ICommand {
  commandName: string = "entrartorneo";
  description: string = "Te permite entrar en algun torneo que esté abierto actualmente";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo = {
    structure: "entrartorneo  ó  entrartorneo @etiquetaDeAlguien  [Solo para administradores]",
    examples: [
      { text: "entrartorneo", isOk: true },
      { text: "entrartorneo algunargumentoextra", isOk: false },
      { text: "entrartorneo @alguien   (Admin)", isOk: true },
      { text: "entrartorneo @alguien algunargumentoextra   (Admin)", isOk: false },
    ],
    notes: 'Este comando tiene doble funcionalidad: La de miembro y la de admin.\nPara activar la de admin, se ocupa serlo y etiquetar a alguien con @etiqueta además.\nSolo se podrá entrar en torneos que no hayan iniciado todavía, mucho menos los que ya terminaron'
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      //Here really starts!
      let mentionedPlayer = await Db_GetStandardInfoPlayerFromRawMsg(args.originalMsg);

      const isAdmin = mentionedPlayer.role === "AD";
      const argumentIsMention = args.commandArgs.length === 1 && Phone_IsAMentionNumber(args.commandArgs[0]);
      const isAdminMode = isAdmin && argumentIsMention;

      if(isAdminMode){
        await chat.SendTxt("Se ha detectado el uso de este comando con privilegios altos, se usará la persona etiquetada en lugar de a ti por el resto del proceso de este comando");
      }

      const INFO_ActiveTournaments = await Kldb.tournament.findMany({
        where: {
          beginDate: {
            equals: null
          }
        },
        include: {
          Tournament_Player_Subscriptions: {
            include: {
              Player: {
                include: { Rank: true, Role: true }
              }
            },
            orderBy: {
              Player: { username: "asc" }
            }
          },
          TournamentType: true,
          Tournament_Rank_RanksAdmitteds: {
            include: { Rank: true },
            orderBy: { Rank: { id: "asc" } }
          }
        }
      });

      //Check if there are active tournaments
      if (INFO_ActiveTournaments.length === 0) {
        await chat.SendTxt("No hay ningún torneo activo por el momento, intentalo después...");
        return;
      }

      //Let user select the tournament
      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        INFO_ActiveTournaments,
        (tournament, index) => (index + 1).toString(),
        `==== 🏆 Torneos Activos para participar🏆 ====
        Elige el número del torneo a participar participar`,
        `🚫 Número inválido 🚫
         Ese número no corresponde a ningún torneo activo. Por favor, selecciona un número valido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄 `,
        (tournament, index) =>
          `
            ${index + 1}. 🏆 *${tournament.name}*  
            - 🎮 *Tipo:* ${tournament.TournamentType.name}  
            - 📅 *Fecha de inicio:* ${Dates_GetFormatedDurationTimeFrom(tournament.beginDate, { includingSeconds: true })}  
            - 🏅 *Rangos admitidos:*  
              ${tournament.Tournament_Rank_RanksAdmitteds.map(rank => `• ${rank.Rank.name}`).join("\n     ")}
            - 👥 *Cupo actual:* ${tournament.Tournament_Player_Subscriptions.length}/${tournament.max_players}
            .
          `,
        60
      );

      if (selectedTournament.Tournament_Player_Subscriptions.length >= selectedTournament.max_players) {
        await chat.SendTxt(`Ya hay suficientes jugadores inscritos en ${selectedTournament.name}, intentalo con otro torneo...`);
        return;
      }

      //Here really starts!

      if(isAdminMode){
        mentionedPlayer = await Db_GetStandardInfoPlayerFromMention(args.commandArgs[0]);
      }

      //Check if already subscribed
      const isAlreadySubscribed = selectedTournament.Tournament_Player_Subscriptions.find(info => info.player_id === mentionedPlayer.id);
      if (isAlreadySubscribed) {
        await chat.SendTxt(`Ya hay una suscripción para ${selectedTournament.name}, no se puede volver a inscribir...`);
        return;
      }

      await chat.SendTournamentInfoFormatted(selectedTournament);
      await chat.SendTxt(`¿Seguro que deseas entrar a ${selectedTournament.name}? (si|ok) para aceptar o cualquier otro mensaje para cancelar`);

      if (!Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(60))) {
        await chat.SendTxt("Se ha cancelado, no te preocupes, puedes volver a intentarlo cuando quieras. Fin");
        return;
      }

      const playerRank = mentionedPlayer.actualRank;
      const isRankAdmitted = selectedTournament.Tournament_Rank_RanksAdmitteds.find(info => info.rank_id === playerRank);
      if (!isRankAdmitted) {
        await chat.SendTxt(`No tienes el rango necesario para participar en ${selectedTournament.name}, mejora de nivel y/o intentalo con otro torneo...`);
        return;
      }

      //Admitted!
      await Db_InsertNewTournamentSubscription(Date.now(), mentionedPlayer.id, selectedTournament.id);

      const updatedPlayerSubscriptions = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { tournament_id: selectedTournament.id },
        include: { Player: { include: { Rank: true, Role: true } } },
      });

      const updatedPlayersText = updatedPlayerSubscriptions.map((info, i) =>
        `${i + 1}. ${info.Player.username} | *${info.Player.Role.name}* | ${info.Player.Rank.name}`).join("\n");

      await chat.SendTxt(`
        🎉 *Registro completado* 🎉

        📌 *Torneo:* ${selectedTournament.name}
        👤 *Jugador:* ${mentionedPlayer.username} | ${mentionedPlayer.Rank.name}
        🏅 *Posición en la lista:* #${updatedPlayerSubscriptions.length}

        📊 *Estado del torneo:*
        - 🟢 Inscritos: ${selectedTournament.Tournament_Player_Subscriptions.length + 1}/${selectedTournament.max_players}
        - 🔄 Lugares restantes: ${selectedTournament.max_players - updatedPlayerSubscriptions.length}

        👥 *Jugadores inscritos:*
        ${updatedPlayersText.trim()}
      `);

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}

// let mentionedPlayerInfo: KlPlayer | null = null;
// if (isAdminMode) {
//   await chat.SendTxt("Se te ha dado privilegio de administrador de este comando, podrás meter a quien quieras a cualquier torneo.");
//   mentionedPlayerInfo = await Kldb.player.findFirst({
//     where: { phoneNumber: Phone_GetPhoneNumberFromMention(args.commandArgs.at(0)).number },
//     include: { Rank: true, Role: true }
//   })
//   if (mentionedPlayerInfo === null) {
//     await chat.SendTxt("La persona etiquetada no es miembro registrado en este bot, no se continuará con el proceso de inscripción a torneos");
//     return;
//   }
// }


// if (isAdminMode) {
//   await chat.SendTxt("Se usará la persona etiquetara para entrar en el torneo");
//   playerId = mentionedPlayerInfo.id;
// }

// if (isAdminMode) {
//   await chat.SendTxt(`Esa persona ya está inscrita en ${selectedTournament.name}, no puedes volver a inscribirle...`);