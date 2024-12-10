import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles } from '../../types/commands';
import { ICommand, MsgType } from '../../types/commands';
import { AllUtilsType } from '../../utils/index_utils';

export default class OtherCommand implements ICommand {
  commandName: string = "other";
  description: string = "Espera hasta que otra persona te responda"
  roleCommand: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    const t = utils.Msg.CreateSenderReplyToolKit(bot, args);
    if (!utils.PhoneNumber.isAMentionNumber(args.commandArgs.at(0) || '')) {
      await t.txtToChatSender("No etiquetaste a nadie, prueba de nuevo");
      return;
    }
    const targetNumber = utils.PhoneNumber.GetPhoneNumberFromMention(args.commandArgs.at(0)!)!;
    await t.txtToChatSender("Ahora se está esperando que conteste....");
    try {
      const thatPerson = await bot.WaitNextRawMsgFromPhone(args.chatId, args.userId, targetNumber.fullRawCleanedNumber, MsgType.text, 30);
      const msgFromThatPerson = utils.Msg.GetTextFromRawMsg(thatPerson);
      await t.txtToChatSender("Se ha recibido el mensaje de esa persona!");
      await t.txtToChatSender(msgFromThatPerson);
    } catch (e) {
      if (utils.Msg.isBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) {
          await t.txtToChatSender("No se recibió mensaje de esa persona");
        }
        else if (e.wasAbortedByUser) {
          await t.txtToChatSender("El usuario original canceló la espera");
        }
      }
    }
  }
}