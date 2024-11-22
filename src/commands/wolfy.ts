import { WAMessage } from '@whiskeysockets/baileys';
import { ICommand, MsgType, SenderType } from '../botTypes';
import Bot from '../bot';

///How can i handle different types of messages in a single function?
///always a command have a commandName
export default class WolfyCommand implements ICommand {
  commandName: string = "wolfy"
  async onMsgReceived(bot: Bot, msg: WAMessage, sender: SenderType, type: MsgType){
    if (sender === SenderType.Group) {
      await bot.SendImg(msg.key.remoteJid!, './resources/wolf.jpg', "(Lobos && Zorros) >>>>>>> todo")
    }
  }
}