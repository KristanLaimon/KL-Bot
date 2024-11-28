import { CommandArgs, ICommand, SenderType } from '../../typos';
import Bot from '../../bot';

///How can i handle different types of messages in a single function? -- READY!j
///always a command have a commandName -- READY!
export default class SexoCommand implements ICommand {
  commandName: string = "sexo"
  description: string = "Lo que tanto le quiero hacer al lobo";
  async onMsgReceived(bot:Bot, args:CommandArgs){
      await bot.SendImg(args.chatSenderId, './resources/wolf.jpg', "Sex Sex Sex Sex")
  }
}