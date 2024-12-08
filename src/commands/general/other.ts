import Bot, { BotUtilsObj } from '../../bot';
import { BotCommandArgs, ICommand, MsgType } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';

export default class OtherCommand implements ICommand {
  commandName: string = "other";
  description: string = "Espera hasta que otra persona te responda"
  roleCommand: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: BotUtilsObj) {
    await bot.SendText('120363369589465642@g.us', "ah!");
    // const t = utils.CreateSenderReplyToolKit(bot, args);
    // if (!args.commandArgs?.at(0)?.startsWith("@")) {
    //   await t.txtToChatSender("tienes que etiquetar a alguien");
    //   return;
    // }
    // const targetNumber = utils.GetPhoneNumberFromMention(args.commandArgs.at(0)!)!;
    // try {
    //   const thatPerson = await bot.WaitRawMessageFromNumber(args.chatId, targetNumber.fullRawCleanedNumber, MsgType.text, 30);
    //   const msgFromThatPerson = utils.GetTextFromRawMsg(thatPerson);
    //   await t.txtToChatSender("Se ha recibido el mensaje de esa persona!");
    //   await t.txtToChatSender(msgFromThatPerson);
    // } catch (e) {
    //   if (utils.isBotWaitMessageError(e)) {
    //     if (!e.wasAbortedByUser) {
    //       await t.txtToChatSender("No se recibió mensaje de esa persona");
    //     }
    //     else if (e.wasAbortedByUser) {
    //       await t.txtToChatSender("Esa persona canceló la espera");
    //     }
    //   }
    // }
  }
}