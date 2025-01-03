import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, CommandHelpInfo } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import { Members_GetMemberInfoFromWhatsappId } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawMsg } from '../../utils/phonenumbers';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import Kldb from "../../utils/kldb";

export default class SeeMySubscribedTournamentsCommand implements ICommand {
  commandName: string = "mistorneos";
  description: string = "Ve los torneos en los que estás inscrito actualmente";
  scopes: CommandScopeType = "General";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo = {
    structure: "mistorneos",
    examples: [{ text: "mistorneos", isOk: true }, { text: "mistorneos someotherargument", isOk: false }],
    notes: "Muestra los torneos en los que estás inscrito actualmente, sin importar el estado del torneo a excepción de si ya ha finalizado"
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const playerInfo = await Members_GetMemberInfoFromWhatsappId(Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg).whatsappId);
      const allSubscribedTournamentByPlayer = await Kldb.tournament_Player_Subscriptions.findMany({
        where: { AND: { player_id: playerInfo.id, Tournament: {OR: [{endDate: null}, { endDate: {gt: Date.now()}}]} }},
        include: { Tournament: { include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: true } } },
      });

      if (allSubscribedTournamentByPlayer.length === 0) {
        await chat.SendText("No estás inscrito en ninguno de los torneos activos", true, { quoted: args.originalMsg});
        await chat.SendReactionToOriginalMsg("❌")
        return;
      }

      const tournamentsSubscribed = allSubscribedTournamentByPlayer.map(subscribedTournament => subscribedTournament.Tournament);

      await chat.SendText(`
        🌟 *Torneos activos en los que estás inscrito* 🌟
        ${tournamentsSubscribed.map((tournament, index) => `
             🏆 *${tournament.name}*  
             - 🎮 *Tipo:* ${tournament.TournamentType.name}  
             - 🕹️ *Formato:* ${tournament.MatchFormat.name}  
             - 👥 *Inscritos:* ${tournament.Tournament_Player_Subscriptions.length}/${tournament.max_players} jugadores
             - 📅 *Inicio:* ${tournament.beginDate ? Dates_GetFormatedDurationTimeFrom(tournament.beginDate, { includingSeconds: true }) : "No ha iniciado"}
             - ⌛ *Días por fase:* ${tournament.matchPeriodTime} días
        `).join("\n")}
      `, true, { quoted: args.originalMsg});
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
