import { WAMessage } from '@whiskeysockets/baileys';
import { ICommand, MsgType, SenderType } from '../botTypes';
import Bot from '../bot';

export default class WolfyCommand implements ICommand {
  commandName: string = "wolfy"
  async onMsgReceived(bot: Bot, msg: WAMessage, sender: SenderType, type: MsgType){
    if (sender === SenderType.Group) {
      await bot.SendImg(msg.key.remoteJid!, './wolf.jpg', "A simple wolf caption for KL Clan")
    }
  }
}