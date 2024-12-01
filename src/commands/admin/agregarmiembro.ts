import { HelperRoleName } from '../../types/helper_types';
import Bot from '../../bot';
import type { BotUtilsObj } from '../../bot_utils';
import { type CommandArgs, type ICommand } from '../../types/bot_types';

export default class AgregarMiembroCommand implements ICommand {
  commandName: string = "agregarmiembro"
  roleCommand: HelperRoleName = "Miembro";
  description: string = "Añade a un nuevo miembro en la base de datos del bot";

  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatId, "===== Agregando un nuevo miembro ======");

    try {
      await bot.SendText(args.chatId, "¿Cuál es el nombre del miembro?");
      let nombre = await bot.WaitTextMessageFrom(args.chatId, args.userId);
      await bot.SendText(args.chatId, `Se ha recibido el mensaje del miembro (${nombre})`);
    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser)
          await bot.SendText(args.chatId, "Se ha cancelado el registro del miembro");
        else
          await bot.SendText(args.chatId, "Se te acabó el tiempo para contestar perroo");
      }
    }
  }
}