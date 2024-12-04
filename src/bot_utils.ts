import { WAMessage, downloadMediaMessage } from '@whiskeysockets/baileys'
import { BotWaitMessageError, MsgType } from './types/bot_types';
import path from 'path';
import fs from 'fs'

type WhatsNumber = {
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

export function GetPhoneNumber(rawMsg: WAMessage): WhatsNumber | null {
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

//TODO: Make a handling error for this one;
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