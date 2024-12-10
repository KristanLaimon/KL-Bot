import makeWASocket from "@whiskeysockets/baileys";
import type { WAMessage } from "@whiskeysockets/baileys";
import { MsgType, SenderType } from './commands';

export type BaileysWASocket = ReturnType<typeof makeWASocket>;

export type WaitTextRegexFormat = {
  regex: RegExp,
  incorrectMsg?: string
}

export type BotCommandArgs = {
  originalMsg: WAMessage,
  chatId: string,
  userId: string,
  senderType: SenderType,
  msgType: MsgType,
  commandArgs: string[]
}

export type BotWaitMessageError = {
  errorMessage: string;
  wasAbortedByUser: boolean;
}

export type TypedPromise<T, E> = Promise<T> & {
  reject: (reason: E) => void;
};