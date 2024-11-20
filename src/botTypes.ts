import makeWASocket from "@whiskeysockets/baileys";
import type { WAMessage, MessageUpsertType } from "@whiskeysockets/baileys";
import Bot from "./bot";

export type BaileysOnMessageObj = {
  messages: WAMessage[];
  type: MessageUpsertType;
  requestId?: string;
};

export interface ICommand {
  commandName: string;
  onMsgReceived: (
    bot: Bot,
    msg: WAMessage,
    sender: SenderType,
    type: MsgType
  ) => Promise<void>;
}

export enum SenderType {
  Group,
  Individual,
}

export enum MsgType {
  text,
  image,
  sticker,
  video,
  audio,
  contact,
}

export type BaileysWASocket = ReturnType<typeof makeWASocket>;
