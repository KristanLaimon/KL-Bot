import Bot from '../../bot';
import type { BotUtilsObj } from '../../bot_utils';
import type { CommandArgs, ICommand } from '../../types/bot_types';

export default class AgregarMiembroCommand implements ICommand {
  commandName: string = "agregarmiembro"
  description: string = "Añade a un nuevo miembro en la base de datos del bot";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatSenderId, "===== Agregando un nuevo miembro ======");

    await bot.SendText(args.chatSenderId, "¿Cuál es el nombre del miembro?");
    const nombre = utils.GetTextFromRawMsg(await bot.WaitMessageFrom(args.chatSenderId, args.userSenderId));

    await bot.SendText(args.chatSenderId, nombre);
  }
}