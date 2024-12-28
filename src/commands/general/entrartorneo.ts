import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, CommandHelpInfo } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import Kldb, { Db_GetTournamentFormattedInfo } from '../../utils/db';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import { Response_isAfirmativeAnswer } from '../../utils/responses';
import { Str_NormalizeLiteralString } from '../../utils/strings';

export default class EnterToTournamentCommand implements ICommand {
  commandName: string = "entrartorneo";
  description: string = "Te permite entrar en algun torneo que esté abierto actualmente";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      const activeTournaments = await Kldb.tournament.findMany({
        where: {
          beginDate: {
            gte: Date.now()
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
          Tournament_Rank_RanksAdmitted: {
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
              ${tournament.Tournament_Rank_RanksAdmitted.map(rank => `• ${rank.Rank.name}`).join("\n     ")}
            - 👥 *Cupo actual:* ${tournament.Tournament_Player_Subscriptions.length}/${tournament.max_players}
            .
          `.trim());
        },
        60
      );

      const senderPlayerInfo = await Kldb.player.findFirstOrThrow({
        where: { phoneNumber: Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg).number },
        include: { Rank: true }
      })

      const isAlreadySubscribed = selectedTournament.Tournament_Player_Subscriptions.find(info => info.player_id === senderPlayerInfo.id);
      if (isAlreadySubscribed) {
        await chat.SendTxt(`Ya estas inscrito en ${selectedTournament.name}, no puedes volver a inscribirte...`);
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

      await chat.SendTxt(`¿Seguro que quieres unirte a ${selectedTournament.name}? (si|ok) para aceptar o cualquier otro mensaje para cancelar`);
      if (Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(60))) {


        const isRankAdmitted = selectedTournament.Tournament_Rank_RanksAdmitted
          .find(info => info.rank_id === senderPlayerInfo.actualRank);

        if (!isRankAdmitted) {
          await chat.SendTxt(`No tienes el rango necesario para participar en ${selectedTournament.name}, mejora de nivel y/o intentalo con otro torneo...`);
          return;
        }

        await Kldb.tournament_Player_Subscriptions.create({
          data: {
            subscription_date: Date.now(),
            player_id: senderPlayerInfo.id,
            tournament_id: selectedTournament.id
          }
        })

        const updatedPlayerSubscriptions = await Kldb.tournament_Player_Subscriptions.findMany({
          where: { tournament_id: selectedTournament.id },
          include: { Player: { include: { Rank: true, Role: true } } },
        });

        const updatedPlayersTxt = updatedPlayerSubscriptions.map((info, i) =>
          `${i + 1}. ${info.Player.username} | *${info.Player.Role.name}* | ${info.Player.Rank.name}`).join("\n");

        await chat.SendTxt(`
          🎉 *¡Te has suscrito con éxito!* 🎉

          📌 *Torneo:* ${selectedTournament.name}
          👤 *Jugador:* ${senderPlayerInfo.username} | ${senderPlayerInfo.Rank.name}
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

