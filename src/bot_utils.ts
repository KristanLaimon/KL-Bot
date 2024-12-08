import { WAMessage, downloadMediaMessage } from '@whiskeysockets/baileys'
import { BotCommandArgs, BotWaitMessageError, MsgType, WaitTextRegexFormat } from './types/bot_types';
import path from 'path';
import fs from 'fs'
import Kldb from './kldb';
import Bot from './bot';

export type WhatsNumber = {
  countryCode: string;
  number: string;
  fullRawCleanedNumber: string;
  whatsappId: string;
}

function isValidNumberStr(numberStr: string): boolean {
  const mentionRegex = /^@\d{13}$/;
  const userIdRegex = /^\d{13}@s.whatsapp.net$/;
  return mentionRegex.test(numberStr) || userIdRegex.test(numberStr);
}

export function GetPhoneNumberFromRawmsg(rawMsg: WAMessage): WhatsNumber | null {
  //Let's check if comes from private msg or group
  let number = rawMsg.key.participant || rawMsg.key.remoteJid || undefined;
  if (!number) return null;
  if (!isValidNumberStr(number)) return null;

  const numberCleaned = number.slice(0, number.indexOf("@"));
  return {
    countryCode: numberCleaned.slice(0, 3),
    fullRawCleanedNumber: numberCleaned,
    number: numberCleaned.slice(3),
    whatsappId: `${numberCleaned.slice(3)}@s.whatsapp.net`
  }
}

export function GetPhoneNumberFromMention(numberStr: string): WhatsNumber | null {
  if (!isValidNumberStr(numberStr)) return null;
  let number = numberStr.slice(1);
  return {
    countryCode: number.slice(0, 3),
    fullRawCleanedNumber: number,
    number: number.slice(3),
    whatsappId: `${number}@s.whatsapp.net`
  }
}

export function isAMentionNumber(mentionStr: string) {
  return /^@\d{13}$/.test(mentionStr);
}

export async function isAdminSender(rawMsg: WAMessage): Promise<boolean> {
  let senderIsAnAdminAsWell: boolean = false;
  try {
    const phoneNumber = GetPhoneNumberFromRawmsg(rawMsg)!.fullRawCleanedNumber;
    senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
  } catch (e) {
    senderIsAnAdminAsWell = false;
  }
  return senderIsAnAdminAsWell;
}

export function CreateSenderReplyToolKit(bot: Bot, args: BotCommandArgs) {
  return {
    async txtToChatSender(msgText: string): Promise<void> {
      await bot.SendText(args.chatId, msgText);
    },
    async imgToChatSender(imgPath: string, caption?: string): Promise<void> {
      await bot.SendImg(args.chatId, imgPath, caption);
    },
    async waitTextFromSender(timeout?: number): Promise<string> {
      return await bot.WaitTextMessageFrom(args.chatId, args.userId, timeout);
    },
    async waitSpecificTextFromSender(regexExpectingFormat: WaitTextRegexFormat, timeout?: number): Promise<string> {
      return await bot.WaitSpecificTextMessageFrom(args.chatId, args.userId, regexExpectingFormat, timeout);
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
      const toReturn = await bot.WaitSpecificTextMessageFrom(args.chatId, args.userId, { regex: possibleResultsRegex, incorrectMsg: fullMsg }, timeout)
      return toReturn;
    }
  }
}

/**
 * Downloads media from a WAMessage and saves it to a specified folder.
 * 
 * @param rawMsg - The raw WhatsApp message containing the media.
 * @param fileName - The desired file name (without extension).
 * @param extension - The file extension (e.g., 'jpg', 'mp4').
 * @param folderToStore - The folder path where the file will be stored.
 * @returns {Promise<boolean>} - True if the media is downloaded successfully, false otherwise.
 */
export async function DownloadMedia(
  rawMsg: WAMessage,
  fileName: string,
  extension: string,
  folderToStore: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(folderToStore)) fs.mkdirSync(folderToStore, { recursive: true });
    const buffer = await downloadMediaMessage(rawMsg, 'buffer', {});
    if (!buffer) return false;
    const outputPath = path.join(folderToStore, `${fileName}.${extension}`);
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    return false;
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
