import Bot, { BotUtilsObj } from '../../bot';
import { BotCommandArgs, ICommand } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  roleCommand: CommandAccessibleRoles = "Administrador"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: BotUtilsObj) {
    const his = ["hola", "hi", "bonjour", "hello"];
    const t = utils.CreateSenderReplyToolKit(bot, args);
    try {
      await t.txtToChatSender("Intenta mandar un saludo escrito");
      const msg = await t.waitFromListTextsFromSender(his, "Tiene que ser alguna de esas opciones", (e, i) => `🦊 ${e}`);
      await t.txtToChatSender(`Has respondido correctamente con: ${msg}`);
    } catch (e) {
      if (utils.isBotWaitMessageError(e))
        if (!e.wasAbortedByUser) await t.txtToChatSender("Se te acabó el tiempo"); else await t.txtToChatSender("Has cancelado el saludo..");
    }
  }
}