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
  /**
   * Apparently for whatsapp, userId works as the same as a chatId for private messages and
   * works as identifier in groups at the same time, can be used indistinguishable, there are
   * no problems with that
   */
  userIdOrChatUserId: string,
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