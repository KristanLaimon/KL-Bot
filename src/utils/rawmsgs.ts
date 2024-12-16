import { BotCommandArgs, BotWaitMessageError, WaitTextRegexFormat } from '../types/bot';
import { WAMessage } from '@whiskeysockets/baileys';
import { MsgType, SenderType } from '../types/commands';
import Bot from '../bot';

export function Msg_GetTextFromRawMsg(rawMsg: WAMessage): string {
  if (!rawMsg.message) return "There's no text in that message";
  return rawMsg.message.conversation || rawMsg.message.extendedTextMessage?.text || "There's no text in that message";
}

export function Msg_IsBotWaitMessageError(error: unknown): error is BotWaitMessageError {
  return (
    typeof error === "object" &&
    error !== null &&
    "wasAbortedByUser" in error &&
    "errorMessage" in error
  );
}

export function Msg_MsgTypeToString(msgType: MsgType): string {
  if (msgType === MsgType.text) return "Mensaje de texto";
  if (msgType === MsgType.image) return "Imagen";
  if (msgType === MsgType.video) return "Video";
  if (msgType === MsgType.audio) return "Audio";
  if (msgType === MsgType.contact) return "Contacto";
  if (msgType === MsgType.sticker) return "Sticker";

  return "Tipo de mensaje desconocido";
}

export const Msg_GetChatIdFromRawMsg = (msg: WAMessage) => msg.key.remoteJid!

export function Msg_GetMsgTypeFromRawMsg(rawMsg: WAMessage): MsgType {
  if (!rawMsg.message) return MsgType.unknown;

  const objMsg = rawMsg.message;
  if (objMsg.imageMessage) return MsgType.image;
  if (objMsg.videoMessage) return MsgType.video;
  if (objMsg.audioMessage) return MsgType.audio;
  if (objMsg.stickerMessage) return MsgType.sticker;
  if (objMsg.conversation || objMsg.extendedTextMessage) return MsgType.text;

  return MsgType.unknown
}

export function Msg_GetSenderTypeFromRawMsg(rawMsg: WAMessage) {
  const chatId = rawMsg.key.remoteJid;

  let senderType: SenderType = SenderType.Individual;
  if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;
  if (chatId && chatId.endsWith("@s.whatsapp.net")) senderType = SenderType.Individual;
  return senderType;
}
