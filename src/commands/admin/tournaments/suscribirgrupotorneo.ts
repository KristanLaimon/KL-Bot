import { Msg_DefaultHandleError } from "../../../utils/rawmsgs";
import {
  CommandAccessibleRoles,
  CommandHelpInfo,
  CommandScopeType,
  ICommand,
  SenderType
} from "../../../types/commands";
import Bot from "../../../bot";
import { BotCommandArgs } from "../../../types/bot";
import { SpecificChat } from "../../../bot/SpecificChat";
import SpecificDialog from "../../../bot/SpecificDialog";

export default class c implements ICommand {
  commandName: string = "suscribir";
  description: string = "Registra este grupo como ";
  scopes: CommandScopeType = "General";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  helpMessage?: CommandHelpInfo;
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    if(args.senderType === SenderType.Individual){
      await chat.SendText("No tiene sentido utilizar este comando en un grupo", true, { quoted: args.originalMsg });
      await chat.SendReactionToOriginalMsg("❌");
      return;
    }

    const dialog = new SpecificDialog(bot, args);
    try {

    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
