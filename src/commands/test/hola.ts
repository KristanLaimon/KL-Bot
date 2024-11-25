import { WAMessage } from "@whiskeysockets/baileys";
import { SenderType } from "../../botTypes";
import type { CommandArgs, ICommand, MsgType } from "../../botTypes";
import Bot from "../../bot";

const l = console.log;

export default class HolaCommand implements ICommand {
  commandName: string = "hola";
  description: string = 'Un comando para saludar y testeo del bot';
  public async onMsgReceived(bot:Bot, args:CommandArgs) {
    await bot.SendText(args.senderId, "Hola, soy el bot");
    
    for (let i = 0; i < args.commandArgs.length; i++) {
      await bot.SendText(args.senderId, `Argumento ${i+1} reconocido: ${args.commandArgs[i]}`)
    }
  }
}
