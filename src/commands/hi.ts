import { WAMessage } from "@whiskeysockets/baileys";
import { SenderType } from "../botTypes";
import type { Command, MsgType } from "../botTypes";
import Bot from "../bot";

const l = console.log;

export default class implements Command {
  commandName: string = "hola";

  public async onMsgReceived(
    bot: Bot,
    msg: WAMessage,
    sender: SenderType,
    type: MsgType
  ) {
    if (sender === SenderType.Individual) l("Viene de un chat individual!!!");
    else if (sender === SenderType.Group) l("Viene de un chat de grupo!!!!!");
    
    console.log(msg);
  }
}
