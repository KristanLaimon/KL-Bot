import { WAMessage} from '@whiskeysockets/baileys'
import { BotWaitMessageError, MsgType } from '../typos';

export function GetMsgTypeFromRawMsg(rawMsg: WAMessage): MsgType {
  if (!rawMsg.message) return MsgType.unknown;

  const objMsg = rawMsg.message;
  if (objMsg.imageMessage)
    return MsgType.image;
  else if (objMsg.videoMessage)
    return MsgType.video;
  else if (objMsg.audioMessage)
    return  MsgType.audio;
  else if (objMsg.stickerMessage)
      return MsgType.sticker;
  else if (objMsg.conversation || objMsg.extendedTextMessage)
    return  MsgType.text;
  else
    return  MsgType.unknown;
}

export function GetTextFromRawMsg(rawMsg: WAMessage): string{
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