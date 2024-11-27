import { CommandArgs, ICommand, MsgType } from "../../botTypes";
import { GetMsgTypeFromRawMsg, GetTextFromRawMsg, isBotWaitMessageError } from '../../utils/Msg'
import Bot from "../../bot";

export default class ResponseCommand implements ICommand {
  commandName: string = "responde";
  description: string = 'Un comando para testear la capacidad de respuesta del bot';

  public async onMsgReceived(bot: Bot, args: CommandArgs) {
    await bot.SendText(args.chatSenderId, "Hola, soy el bot, respondeme");
    let seconds = 120 * 1000;
    try {
      const response = await bot.WaitMessageFrom(args.chatSenderId, args.userSenderId, seconds);
      const msgType = GetMsgTypeFromRawMsg(response);

      if (msgType === MsgType.text) {
        bot.SendText(args.chatSenderId, "Me dijiste: " + GetTextFromRawMsg(response));
      } else {
        bot.SendText(args.chatSenderId, "No me mandaste un texto, wtf");
      }
    } catch (error) {
      if (isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser)
          await bot.SendText(args.chatSenderId, `El usuario ${args.msgObj.pushName} canceló la operación`);
        else
          await bot.SendText(args.chatSenderId, `Te tardaste ${seconds / 1000} segundos en responder...`);
      }
    }
  }
}
