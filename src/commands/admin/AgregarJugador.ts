import Bot from '../../bot';
import type { BotUtilsObj } from '../../bot_utils';
import { MsgType, type CommandArgs, type ICommand } from '../../types/bot_types';

export default class AgregarMiembroCommand implements ICommand {
  commandName: string = "agregarmiembro"
  description: string = "Añade a un nuevo miembro en la base de datos del bot";

  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatSenderId, "===== Agregando un nuevo miembro ======");

    try {
      await bot.SendText(args.chatSenderId, "¿Cuál es el nombre del miembro?");
      let nombre = utils.GetTextFromRawMsg(await bot.WaitMessageFrom(args.chatSenderId, args.userSenderId, MsgType.text, 5));
      await bot.SendText(args.chatSenderId, "Se ha recibido el mensaje del miembro (false)jiji");
    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser) {
          await bot.SendText(args.chatSenderId, "Se ha cancelado el registro del miembro");
        } else {
          await bot.SendText(args.chatSenderId, "Se te acabó el tiempo para contestar perroo");
        }
      }
    }
  }
}