import { BotCommandArgs, BotWaitMessageError } from "../types/bot";
import { WAMessage } from '@whiskeysockets/baileys';
import { ICommand, MsgType, SenderType } from "../types/commands";
import Bot from '../bot';
import KlLogger from "../bot/logger";

export function Msg_GetTextFromRawMsg(rawMsg: WAMessage): string {
  if (!rawMsg.message) return "There's no text in that message";
  return rawMsg.message.conversation || rawMsg.message.extendedTextMessage?.text || "There's no text in that message";
}

/**
 * Default error handler for when an error occurs in a command.
 * @param bot The bot instance.
 * @param chatId The chatId where the error occurred.
 * @param errorGeneric The error that occurred.
 * bot and chatId are mandatory because we need to send a message to the chat where the error
 * occurred. errorGeneric is mandatory because we need to know what error occurred to handle it
 * properly. If errorGeneric is a BotWaitMessageError, we send a message to the chat telling the
 * user if they cancelled the operation or if the timeout was reached. If errorGeneric is not a
 * BotWaitMessageError, we send a message to the chat with the error message.
 * @param originalCommand originalCommand to provide more error context
 */
export function Msg_DefaultHandleError(bot: Bot, args: BotCommandArgs, errorGeneric: any, originalCommand?:ICommand) {
  if (Msg_IsBotWaitMessageError(errorGeneric)) {
    if (errorGeneric.wasAbortedByUser) {
      bot.Send.Text(args.chatId, "Se ha cancelado el comando...");
      KlLogger.error(`Command ${originalCommand?.commandName} was aborted by user`);
    }else{
     bot.Send.Text(args.chatId, "Te has tardado mucho en contestar...");
     KlLogger.error(`Command ${originalCommand?.commandName} timeout`);
    }
  }
  else {
    bot.Send.Text(args.chatId, 'Ocurrió un error al ejecutar el comando... \n' + JSON.stringify(errorGeneric, null, 4));
    KlLogger.error(`Command ${originalCommand?.commandName} error: ${JSON.stringify(errorGeneric, null, 4)}`);
  }
  bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "❌");
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
