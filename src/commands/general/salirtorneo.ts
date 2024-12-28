import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, CommandHelpInfo } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import Kldb, { Db_GetTournamentFormattedInfo } from '../../utils/db';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import { Response_isAfirmativeAnswer } from '../../utils/responses';

export default class ExitATournamentCommand implements ICommand {
  commandName: string = "salirtorneo";
  description: string = "Permite salir de un torneo en el que estés registrado, solo podrás salir de torneos que no haya empezado todavía";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";

  helpMessage?: CommandHelpInfo = {
    structure: "salirtorneo",
    examples: [
      { text: "salirtorneo", isOk: true },
      { text: "salirtorneo someotherargument", isOk: false }
    ],
    notes: "Solo podrás salirte de torneos en que te hayas inscrito y no hayan empezado todavía"
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const playerInfo = await Members_GetMemberInfoFromPhone(Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg).number);
      const allSubscribedTournamentByPlayer = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { player_id: playerInfo.id },
        include: { Tournament: { include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: true } } },
      });

      if (allSubscribedTournamentByPlayer.length === 0) {
        await chat.SendTxt("No estás inscrito en ninguno de los torneos activos");
        return;
      }

      const tournamentsSubscribed = allSubscribedTournamentByPlayer.map(subscribedTournament => subscribedTournament.Tournament);


      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        tournamentsSubscribed,
        (tournament, index) => (index + 1).toString(),
        "====== 🏆 Torneos Inscritos 🏆 ======\n💡 Selecciona el torneo del que deseas salirte. (Si el torneo ya empezó no aparecerá aquí)",
        "🚫 Número inválido 🚫\nEse número no corresponde a ningún torneo. Por favor, selecciona un número válido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄\n\n",
        (tournament, index) => `
          ${index + 1}. 🏆 *${tournament.name}*  
            - 🎮 *Tipo:* ${tournament.TournamentType.name}  
            - 📅 *Creado hace:* ${Dates_GetFormatedDurationTimeFrom(tournament.creationDate, { includingSeconds: true })}
            .
          `.trim(),
        60
      );

      const imgCaptionInfo = await Db_GetTournamentFormattedInfo(selectedTournament.id);
      if (selectedTournament.cover_img_name) {
        await chat.SendImg(`db/tournaments_covers/${selectedTournament.cover_img_name}`, imgCaptionInfo);
      } else {
        await chat.SendTxt(imgCaptionInfo);
      }

      await chat.SendTxt("¿Estás seguro que quieres salirte?");
      if (Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(60))) {
        await Kldb.tournament_Player_Subscriptions.delete({
          where: {
            tournament_id_player_id: {
              tournament_id: selectedTournament.id,
              player_id: playerInfo.id
            }
          }
        })

        await chat.SendTxt(`
          === 🎉 Te has salido con éxito ===
          🏆 *Torneo:* ${selectedTournament.name}
          
          📊 *Estado del torneo:*
          - 👥 *Inscritos:* ${selectedTournament.Tournament_Player_Subscriptions.length - 1}/${selectedTournament.max_players}
          - 📉 *Lugares restantes:* ${selectedTournament.max_players - (selectedTournament.Tournament_Player_Subscriptions.length - 1)}
        `);
      } else {
        await chat.SendTxt("Se ha cancelado, aquí no ha pasado nada...")
      }
    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}
