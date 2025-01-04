import { SpecificChat } from "../../bot/SpecificChat";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import Bot from "../../bot";
import { BotCommandArgs } from "../../types/bot";
import SpecificDialog from "../../bot/SpecificDialog";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";

export default class c implements ICommand {
  commandName: string = "partida";
  description: string = "Registra los resultados de una partida de torneo. Se REQUIERE subir una captura de pantalla de los resultados y la aprobación de un administrador. Este es solo el primer paso";
  scopes: CommandScopeType = "General";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo;
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    const dialog = new SpecificDialog(bot, args);
    try {

    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
