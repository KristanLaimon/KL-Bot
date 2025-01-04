import { SpecificChat } from "../../bot/SpecificChat";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import Bot from "../../bot";
import { BotCommandArgs } from "../../types/bot";
import SpecificDialog from "../../bot/SpecificDialog";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import Kldb from "../../utils/kldb";
import {
  Db_GetStandardInfoPlayerFromRawMsg, Db_Info_LocatePlayerMatch,
  Db_Info_Str_AllPhasePlanningMatches,
  Db_Info_TournamentPlanningMatchesByPhase
} from "../../utils/db";
import { Fs_ToJSONSafe } from "../../utils/filesystem";

export default class SavePartidaTournamentMatchCommand implements ICommand {
  commandName: string = "partida";
  description: string = "Registra los resultados de una partida de torneo. Se REQUIERE subir una captura de pantalla de los resultados y la aprobación de un administrador. Este es solo el primer paso";
  scopes: CommandScopeType = "General";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo;
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    const dialog = new SpecificDialog(bot, args);
    try {
      const playerInfo = await Db_GetStandardInfoPlayerFromRawMsg(args.originalMsg);
      const allSubscribedTournamentByPlayer = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { AND: { player_id: playerInfo.id, Tournament: {OR: [{endDate: null}, { endDate: {gt: Date.now()}}]} }},
        include: { Tournament: { include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: true } } },
      });

      if(allSubscribedTournamentByPlayer.length === 0){
        await chat.SendText("No estás inscrito en ninguno de los torneos activos", true, { quoted: args.originalMsg});
        await chat.SendReactionToOriginalMsg("✅");
        return;
      }

      if(allSubscribedTournamentByPlayer.length === 1){
        const subscription = allSubscribedTournamentByPlayer[0];
        //TODO: What to do if tournament actual phase is 0??
        const actualMatch = await Db_Info_LocatePlayerMatch(subscription.tournament_id, subscription.Tournament.actual_phase, playerInfo.id);

        if(actualMatch === null){
          await chat.SendText("Hubo un error raro al buscar la partida en la que te encuentras en el único torneo en le que estás ahora", true, { quoted: args.originalMsg});
          await chat.SendReactionToOriginalMsg("❌");
          return;
        }

        await chat.SendText(`
          Se detectó que solo estás en un torneo registrado.
          Partido en el que te encuentras actualmente en el torneo ${subscription.Tournament.name}:
          
          ${actualMatch.BlueTeam.map(player => player.username).join(', ')}
          ------------ Vs ------------
          ${actualMatch.OrangeTeam.map(player => player.username).join(', ')}
          
          
        `, true, { quoted: args.originalMsg});
      }

      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
