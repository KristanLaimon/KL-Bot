import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import { Dates_GetFormatedDurationTimeFrom } from "../../utils/dates";
import { Db_GetStandardInfoPlayerFromMention, Db_GetStandardInfoPlayerFromRawMsg } from "../../utils/db";
import { Phone_IsAMentionNumber } from "../../utils/phonenumbers";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import { Response_isAfirmativeAnswer } from "../../utils/responses";
import Kldb from "../../utils/kldb";

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
      let playerInfo = await Db_GetStandardInfoPlayerFromRawMsg(args.originalMsg);
      const isAdmin = playerInfo.role === 'AD';
      const hasMentionedSomeone = args.commandArgs.length === 1 && Phone_IsAMentionNumber(args.commandArgs.at(0));

      if(isAdmin && hasMentionedSomeone){
        playerInfo = await Db_GetStandardInfoPlayerFromMention(args.commandArgs.at(0));
        await chat.SendTxt("Se te ha dado privilegio de administrador de este comando, se utilizará la persona etiquetada en lugar de a ti para este proceso y se mostrarán su lista de torneos inscritos");
      }

      const allSubscribedTournamentByPlayer = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { player_id: playerInfo.id },
        include: { Tournament: { include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: true } } },
      });

      if (allSubscribedTournamentByPlayer.length === 0) {
        await chat.SendTxt("No hay ninguna suscripción a ningún torneo activo de momento", true, { quoted: args.originalMsg});
        return;
      }

      const tournamentsSubscribed = allSubscribedTournamentByPlayer.map(subscribedTournament => subscribedTournament.Tournament);

      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        tournamentsSubscribed,
        (tournament, index) => (index + 1).toString(),
        "====== 🏆 Torneos Inscritos 🏆 ======\n💡 Selecciona el torneo a salir. (Si el torneo ya empezó no aparecerá aquí)",
        "🚫 Número inválido 🚫\nEse número no corresponde a ningún torneo. Por favor, selecciona un número válido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄\n\n",
        (tournament, index) => `
          ${index + 1}. 🏆 *${tournament.name}*  
            - 🎮 *Tipo:* ${tournament.TournamentType.name}  
            - 📅 *Creado hace:* ${Dates_GetFormatedDurationTimeFrom(tournament.creationDate, { includingSeconds: true })}
          `.trim(),
        60,
        {withDoubleSeparationOptions: true},
        {quoted: args.originalMsg}
      );

      await chat.SendTournamentInfoFormatted(selectedTournament);

      await chat.SendTxt("¿Estás seguro de salir de ese torneo?");
      if (Response_isAfirmativeAnswer(await chat.AskText(60))) {
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
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
