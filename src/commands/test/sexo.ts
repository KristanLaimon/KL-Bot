import { ICommand, CommandArgs } from '../../types/bot_types';
import Bot from '../../bot';
import { HelperRoleName } from '../../types/helper_types';

///How can i handle different types of messages in a single function? -- READY!j
///always a command have a commandName -- READY!
export default class SexoCommand implements ICommand {
  commandName: string = "sexo"
  roleCommand: HelperRoleName = "Miembro";
  description: string = "Lo que tanto le quiero hacer al lobo";
  async onMsgReceived(bot: Bot, args: CommandArgs) {
    await bot.SendImg(args.chatId, './resources/wolf.jpg', "Sex Sex Sex Sex")
  }
}