import { BotCommandArgs } from '../../types/bot';
import Bot from '../../bot';
import { HelperRoleName, ICommand } from '../../types/commands';

///How can i handle different types of messages in a single function? -- READY!j
///always a command have a commandName -- READY!
export default class WolfCommand implements ICommand {
  commandName: string = "wolf"
  roleCommand: HelperRoleName = "Miembro";
  description: string = "Lobitosssss";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    await bot.SendImg(args.chatId, './resources/wolf.jpg', "Sex Sex Sex Sex")
  }
}