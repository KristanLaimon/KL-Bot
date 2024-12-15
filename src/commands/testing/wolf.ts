import { BotCommandArgs } from '../../types/bot';
import Bot from '../../bot';
import { HelperRoleName, ICommand, ScopeType } from '../../types/commands';
import { SpecificChat } from '../../bot/SpecificChat';

///How can i handle different types of messages in a single function? -- READY!j
///always a command have a commandName -- READY!
export default class WolfCommand implements ICommand {
  commandName: string = "wolf"
  minimumRequiredPrivileges: HelperRoleName = "Cualquiera";
  description: string = "Lobitosssss";
  maxScope: ScopeType = "Group"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    await chat.SendImg('./resources/wolf.jpg', "Sexxx");
  }
}