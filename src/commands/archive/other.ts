import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, CommandScopeType } from '../../types/commands';
import { ICommand, MsgType } from '../../types/commands';
import { Phone_GetPhoneNumberFromMention, Phone_IsAMentionNumber } from '../../utils/phonenumbers';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';

export default class OtherCommand implements ICommand {
  commandName: string = "other";
  description: string = "Espera hasta que otra persona te responda"
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  maxScope: CommandScopeType = "Group";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    if (!Phone_IsAMentionNumber(args.commandArgs.at(0) || '')) {
      await bot.Send.Text(args.chatId, "No etiquetaste a nadie, prueba de nuevo");
      return;
    }
    const targetNumber = Phone_GetPhoneNumberFromMention(args.commandArgs.at(0)!)!.number;
    await bot.Send.Text(args.chatId, "Ahora se está esperando que conteste....");
    try {
      const thatPerson = await bot.Receive.WaitNextRawMsgFromPhone(args.chatId, args.userIdOrChatUserId, targetNumber, MsgType.text, 60);
      const msgFromThatPerson = Msg_GetTextFromRawMsg(thatPerson);
      await bot.Send.Text(args.chatId, "Se ha recibido el mensaje de esa persona!");
      await bot.Send.Text(args.chatId, msgFromThatPerson);

    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) {
          await bot.Send.Text(args.chatId, "No se recibió mensaje de esa persona");
        }
        else if (e.wasAbortedByUser) {
          await bot.Send.Text(args.chatId, "El usuario original canceló la espera");
        }
      }
    }
  }
}