import makeWASocket from "@whiskeysockets/baileys";
import type { WAMessage, MessageUpsertType } from "@whiskeysockets/baileys";
import Bot from "../bot";
import { BotUtilsObj } from '../bot';
import { CommandAccessibleRoles } from './helper_types';

type FlowCallBack = (bot: Bot, message: WAMessage, waitMessage: (chatId: string, message: WAMessage) => Promise<string>) => Promise<void>;

export type WaitTextRegexFormat = {
  regex: RegExp,
  incorrectMsg: string
}

export type BaileysOnMessageObj = {
  messages: WAMessage[];
  type: MessageUpsertType;
  requestId?: string;
};

export type CommandArgs = {
  originalPromptMsgObj: WAMessage,
  chatId: string,
  userId: string,
  senderType: SenderType,
  msgType: MsgType,
  commandArgs: string[]
}

export interface ICommand {
  commandName: string;
  description: string;
  roleCommand: CommandAccessibleRoles;
  onMsgReceived: (bot: Bot, args: CommandArgs, utils: BotUtilsObj) => Promise<void>;
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
  unknown
}

export type BaileysWASocket = ReturnType<typeof makeWASocket>;

export type BotWaitMessageError = {
  errorMessage: string;
  wasAbortedByUser: boolean;
}

export type TypedPromise<T, E> = Promise<T> & {
  reject: (reason: E) => void;
};