import { WAMessage } from '@whiskeysockets/baileys';
import { CommandArgs, ICommand, MsgType, SenderType } from '../../botTypes';
import Bot from '../../bot';

///How can i handle different types of messages in a single function?
///always a command have a commandName
export default class SexoCommand implements ICommand {
  commandName: string = "sexo"
  description: string = "Lo que tanto le quiero hacer al lobo";
  async onMsgReceived(bot:Bot, args:CommandArgs){
    if (args.senderType === SenderType.Group) {
      await bot.SendImg(args.senderId, './resources/wolf.jpg', "Sex Sex Sex Sex")
    }
  }
}