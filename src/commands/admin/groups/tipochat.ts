import { Msg_DefaultHandleError } from "../../../utils/rawmsgs";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../../types/commands";
import Bot from "../../../bot";
import { BotCommandArgs } from "../../../types/bot";
import { SpecificChat } from "../../../bot/SpecificChat";
import SpecificDialog from "../../../bot/SpecificDialog";

export default class TipoChatCommand implements ICommand {
  commandName: string = "tipochat";
  description: string = "Verifica que tipo de chat es este para el bot";
  scopes: CommandScopeType[] = ["General", "UnregisteredGroup", "TournamentValidator"];
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  helpMessage?: CommandHelpInfo;
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    let toSend:string = 'No se ha identificado el chat';
    switch(args.scopeCalled){
      case "General":{
        toSend = "General";
        break;
      }
      case "TournamentValidator": {
        toSend = "Validador de torneos";
        break;
      }
      case "UnregisteredGroup": {
        toSend = "Grupo sin registrar"
        break;
      }
    }
    await chat.SendText(toSend, true, { quoted: args.originalMsg });
  }
}
