import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, CommandHelpInfo } from '../../types/commands';
import { KlPlayer } from '../../types/db';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import Kldb, { Db_GetTournamentFormattedInfo, Db_InsertNewTournamentSubscription } from '../../utils/db';
import { Phone_GetFullPhoneInfoFromRawmsg, Phone_GetPhoneNumberFromMention, Phone_IsAMentionNumber } from '../../utils/phonenumbers';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import { Response_isAfirmativeAnswer } from '../../utils/responses';
import { Str_NormalizeLiteralString } from '../../utils/strings';

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
      const senderPlayerInfo = await Kldb.player.findFirstOrThrow({
        where: { phoneNumber: Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg).number },
        include: { Rank: true }
      })

      const isAdmin = senderPlayerInfo.role === "AD";
      const argumentIsMention = args.commandArgs.length === 1 && Phone_IsAMentionNumber(args.commandArgs[0]);
      const isAdminMode = isAdmin && argumentIsMention;
      let mentionedPlayerInfo: KlPlayer | null = null;
      if (isAdminMode) {
        await chat.SendTxt("Se te ha dado privilegio de administrador de este comando, podrás meter a quien quieras a cualquier torneo.");
        mentionedPlayerInfo = await Kldb.player.findFirst({
          where: { phoneNumber: Phone_GetPhoneNumberFromMention(args.commandArgs.at(0)).number },
          include: { Rank: true, Role: true }
        })
        if (mentionedPlayerInfo === null) {
          await chat.SendTxt("La persona etiquetada no es miembro registrado en este bot, no se continuará con el proceso de inscripción a torneos");
          return;
        }
      }

      const activeTournaments = await Kldb.tournament.findMany({
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
      if (activeTournaments.length === 0) {
        await chat.SendTxt("No hay ningun torneo activo por el momento, intentalo después...");
        return;
      }

      let startMsg = `
        ==== 🏆 Torneos Activos para participar🏆 ====
        Elige el número del torneo al cual desees participar:
      `;
      startMsg = Str_NormalizeLiteralString(startMsg);

      let errorMsg = `
        🚫 Número inválido 🚫
         Ese número no corresponde a ningun torneo activo. Por favor, selecciona un número valido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄
      `;
      errorMsg = Str_NormalizeLiteralString(errorMsg);

      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        activeTournaments,
        (tournament, index) => (index + 1).toString(),
        startMsg,
        errorMsg,
        (tournament, index) => {
          return Str_NormalizeLiteralString(`
            ${index + 1}. 🏆 *${tournament.name}*  
            - 🎮 *Tipo:* ${tournament.TournamentType.name}  
            - 📅 *Fecha de inicio:* ${Dates_GetFormatedDurationTimeFrom(tournament.beginDate, { includingSeconds: true })}  
            - 🏅 *Rangos admitidos:*  
              ${tournament.Tournament_Rank_RanksAdmitteds.map(rank => `• ${rank.Rank.name}`).join("\n     ")}
            - 👥 *Cupo actual:* ${tournament.Tournament_Player_Subscriptions.length}/${tournament.max_players}
            .
          `.trim());
        },
        60
      );

      let playerId = senderPlayerInfo.id;
      if (isAdminMode) {
        await chat.SendTxt("Se usará la persona etiquetara para entrar en el torneo");
        playerId = mentionedPlayerInfo.id;
      }

      const isAlreadySubscribed = selectedTournament.Tournament_Player_Subscriptions.find(info => info.player_id === playerId);
      if (isAlreadySubscribed) {
        if (isAdminMode) {
          await chat.SendTxt(`Esa persona ya está inscrita en ${selectedTournament.name}, no puedes volver a inscribirle...`);
        } else {
          await chat.SendTxt(`Ya estas inscrito en ${selectedTournament.name}, no puedes volver a inscribirte...`);
        }
        return;
      }


      if (selectedTournament.Tournament_Player_Subscriptions.length >= selectedTournament.max_players) {
        await chat.SendTxt(`Ya hay suficientes jugadores inscritos en ${selectedTournament.name}, intentalo con otro torneo...`);
        return;
      }

      const fullTournamentInfo = await Db_GetTournamentFormattedInfo(selectedTournament.id);
      if (selectedTournament.cover_img_name !== null)
        await chat.SendImg(`db/tournaments_covers/${selectedTournament.cover_img_name}`, fullTournamentInfo);
      else
        await chat.SendTxt(fullTournamentInfo);

      if (isAdminMode) {
        await chat.SendTxt(`¿Seguro que quieres inscribir a ${mentionedPlayerInfo.username} en ${selectedTournament.name}? (si|ok) para aceptar o cualquier otro mensaje para cancelar`);
      } else {
        await chat.SendTxt(`¿Seguro que quieres unirte a ${selectedTournament.name}? (si|ok) para aceptar o cualquier otro mensaje para cancelar`);
      }

      if (Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(60))) {
        const playerRank = isAdminMode ? mentionedPlayerInfo.actualRank : senderPlayerInfo.actualRank;
        const isRankAdmitted = selectedTournament.Tournament_Rank_RanksAdmitteds
          .find(info => info.rank_id === playerRank);

        if (!isRankAdmitted) {
          if (isAdminMode) {
            await chat.SendTxt(`La persona mencionada no tiene permisos suficientes para participar en ${selectedTournament.name}, dile que mejore de nivel y/o intente con otro torneo...`);
          } else {
            await chat.SendTxt(`No tienes el rango necesario para participar en ${selectedTournament.name}, mejora de nivel y/o intentalo con otro torneo...`);
          }
          return;
        }

        await Db_InsertNewTournamentSubscription(Date.now(), playerId, selectedTournament.id);

        const updatedPlayerSubscriptions = await Kldb.tournament_Player_Subscriptions.findMany({
          where: { tournament_id: selectedTournament.id },
          include: { Player: { include: { Rank: true, Role: true } } },
        });

        const updatedPlayersTxt = updatedPlayerSubscriptions.map((info, i) =>
          `${i + 1}. ${info.Player.username} | *${info.Player.Role.name}* | ${info.Player.Rank.name}`).join("\n");

        await chat.SendTxt(`
          🎉 *Registro completado* 🎉

          📌 *Torneo:* ${selectedTournament.name}
          👤 *Jugador:* ${isAdminMode ? mentionedPlayerInfo.username : senderPlayerInfo.username} | ${isAdminMode ? mentionedPlayerInfo.Rank.name : senderPlayerInfo.Rank.name}
          🏅 *Posición en la lista:* #${updatedPlayerSubscriptions.length}

          📊 *Estado del torneo:*
          - 🟢 Inscritos: ${selectedTournament.Tournament_Player_Subscriptions.length + 1}/${selectedTournament.max_players}
          - 🔄 Lugares restantes: ${selectedTournament.max_players - updatedPlayerSubscriptions.length}

          👥 *Jugadores inscritos:*
          ${updatedPlayersTxt.trim()}
        `);

      } else {
        await chat.SendTxt("Veo que no deseas participar en el torneo, no te preocupes, puedes volver a intentarlo cuando quieras. Fin");
      }

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}

