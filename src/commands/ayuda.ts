import Bot from '../bot';
import { SpecificChat } from '../bot/SpecificChat';
import { BotCommandArgs } from '../types/bot';
import { ICommand, CommandAccessibleRoles, ScopeType } from '../types/commands';

export default class ExternalHelp_AyudaCommand implements ICommand {
  commandName: string = "ayuda";
  description: string = "Obten ayuda en un grupo no registrado por este bot";
  maxScope: ScopeType = "External";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    await chat.SendTxt("Estás en un grupo no registrado por este bot, esta es la ayuda creo");
  }
}