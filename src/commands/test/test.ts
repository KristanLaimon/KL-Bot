import Bot, { BotUtilsObj } from '../../bot';
import { BotCommandArgs, ICommand } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  roleCommand: CommandAccessibleRoles = "Administrador"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: BotUtilsObj) {
    const t = utils.CreateSenderReplyToolKit(bot, args);
    await t.txtToChatSender("HOla");
    try {
      await t.txtToChatSender("Envia un número");
      const msg = await t.waitSpecificTextFromSender({ regex: /^\d+$/, incorrectMsg: "Solo puedes enviar números!" }, 2)
      await t.txtToChatSender(msg);
      await t.txtToChatSender("yayy");
    } catch (e) {
      if (utils.isBotWaitMessageError(e))
        if (!e.wasAbortedByUser)
          await t.txtToChatSender("Se te acabó el tiempo");
    }
  }
}