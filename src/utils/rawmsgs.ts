import { BotCommandArgs, BotWaitMessageError, WaitTextRegexFormat } from '../types/bot';
import { WAMessage } from '@whiskeysockets/baileys';
import { MsgType } from '../types/commands';
import Bot from '../bot';

export function CreateSenderReplyToolKit(bot: Bot, args: BotCommandArgs) {
  return {
    async txtToChatSender(msgText: string): Promise<void> {
      await bot.SendTxtToChatId(args.chatId, msgText);
    },
    async imgToChatSender(imgPath: string, caption?: string): Promise<void> {
      await bot.SendImgToChatId(args.chatId, imgPath, caption);
    },
    async waitTextFromSender(timeout?: number): Promise<string> {
      return await bot.WaitNextTxtMsgFromUserId(args.chatId, args.userId, timeout);
    },
    async waitSpecificTextFromSender(regexExpectingFormat: WaitTextRegexFormat, timeout?: number): Promise<string> {
      return await bot.WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(args.chatId, args.userId, regexExpectingFormat, timeout);
    },
    /**
     * A method to wait a message among a fixed set of options from user
     * #### Example usage:
     * User can only answer from this options. ["hola", "hi", "bonjour"]
     * 
     * If user didn't select any option, the bot can send "You haven't chosed a correct option" thats errorMsg parameter
     * 
     * If you wanna display next all options with your own style:
     * 
     * Lets say we wanna display options with emojis and bold text
     * 
     * """
     * 
     * 🦊 hola
     * 
     * 🦊 hi
     * 
     * 🦊 bonjour
     * 
     * """
     * 
     * so, we needto pass formatEachElementCallBack parameter like this:
     * 
     * (greetingStr) => `'🦊 ${greetingStr}'`
     * 
     * and finally the timeout, indicates how much time in seconds the user have to answer otherwise, this returns a
     * "exception" (rejecting promise) which you should handle with a try / catch block
     * @param possibleResults A string list with already fixed possible results that the user can choose from (Mandatory)
     * @param errorMsg Message to show when user has not chosen any of the possible results (wrong) (Optional)
     * @param formatEachElementCallback  A function that formats each element of the possible results and send a list like (Optional)
     * @param timeout 
     * @returns 
     */
    async waitFromListTextsFromSender(possibleResults: string[], errorMsg?: string, formatEachElementCallback?: (element: string, index?: number) => string, timeout?: number): Promise<string> {
      const possibleResultsRegex = new RegExp(`^(${possibleResults.join("|")})$`);
      let fullMsg: string | undefined = errorMsg;
      if (errorMsg) {
        if (formatEachElementCallback) {
          fullMsg += "\n";
          fullMsg += possibleResults.map((element: string, index: number) => `${formatEachElementCallback(element, index)}`).join("\n");
        }
      }
      const toReturn = await bot.WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(args.chatId, args.userId, { regex: possibleResultsRegex, incorrectMsg: fullMsg }, timeout)
      return toReturn;
    },
    async waitToThisPhoneNumberToAnswerText(phoneNumberCleaned: string, timeout?: number): Promise<string> {
      const rawMsg = await bot.WaitNextRawMsgFromPhone(args.chatId, args.userId, phoneNumberCleaned, MsgType.text, timeout);
      return GetTextFromRawMsg(rawMsg);
    }
  }
}

export function GetMsgTypeFromRawMsg(rawMsg: WAMessage): MsgType {
  if (!rawMsg.message) return MsgType.unknown;

  const objMsg = rawMsg.message;
  if (objMsg.imageMessage)
    return MsgType.image;
  else if (objMsg.videoMessage)
    return MsgType.video;
  else if (objMsg.audioMessage)
    return MsgType.audio;
  else if (objMsg.stickerMessage)
    return MsgType.sticker;
  else if (objMsg.conversation || objMsg.extendedTextMessage)
    return MsgType.text;
  else
    return MsgType.unknown;
}

export function GetTextFromRawMsg(rawMsg: WAMessage): string {
  if (!rawMsg.message) return "There's no text in that message";
  return rawMsg.message.conversation || rawMsg.message.extendedTextMessage?.text || "There's no text in that message";
}

export function isBotWaitMessageError(error: unknown): error is BotWaitMessageError {
  return (
    typeof error === "object" &&
    error !== null &&
    "wasAbortedByUser" in error &&
    "errorMessage" in error
  );
}

export function MsgTypeToString(msgType: MsgType): string {
  if (msgType === MsgType.text) return "Mensaje de texto";
  if (msgType === MsgType.image) return "Imagen";
  if (msgType === MsgType.video) return "Video";
  if (msgType === MsgType.audio) return "Audio";
  if (msgType === MsgType.contact) return "Contacto";
  if (msgType === MsgType.sticker) return "Sticker";

  return "Tipo de mensaje desconocido";
}
