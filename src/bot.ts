import { AnyMessageContent, MessageUpsertType, MiscMessageGenerationOptions, WAMessage } from "@whiskeysockets/baileys";
import type { BotCommandArgs, BotWaitMessageError, WaitTextRegexFormat } from "./types/bot";
import { GetTextFromRawMsg } from './utils/rawmsgs';
import WhatsSocketMsgQueue from './bot/WhatsSocketMsgQueue';
import allUtils from './utils/index_utils';
import fs from "fs";
import { MsgType, SenderType } from './types/commands';
import WhatsSocket from './bot/WhatsSocket';

// type BaileysInsertArgs = {
//   messages: WAMessage[];
//   type: MessageUpsertType;
//   requestId?: string;
// }
// this.msgQueue = new SocketMessageQueue(this.socket, this.maxQueueMsgs, this.coolDownTime);

type BotArgs = {
  prefix?: string;
  coolDownSecondsTime?: number;
  maxQueueMsgs?: number; /** Max quantity of msgs to handle at the same time */
};

export default class Bot {
  private socket: WhatsSocket;
  private msgQueue: WhatsSocketMsgQueue;
  private config: BotArgs;

  constructor(args: BotArgs | undefined) {
    this.config = {
      coolDownSecondsTime: 1000 * (args?.coolDownSecondsTime || 1),
      maxQueueMsgs: args?.maxQueueMsgs || 10,
      prefix: args?.prefix || "!",
    };
    // this.WaitNextRawMsgFromId.bind(this, 'NO ID THIS COMES FROM BIND()', 30000);
  }

  //#region ================= CORE Methods ====================
  public async StartBot() {

  }

  /**
   * Expect a TEXT message from the user (Doesn't matter the format)
   * max message timeout in seconds has been reached.
   * @param chatSenderId ChatId where the message comes from
   * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
   * @param timeout  Time in seconds to wait for the user to respond
   * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
   * @returns  The message sent by the user
   */
  public async WaitNextTxtMsgFromUserId(chatSenderId: string, participantId: string, timeout: number = 30): Promise<string> {
    return allUtils.Msg.GetTextFromRawMsg(await this.WaitNextRawMsgFromId(chatSenderId, participantId, MsgType.text, timeout));
  }

  /**
   * Expect a TEXT message from the user with a specific format (with regex) or throws error if user cancel the operation or 
   * max message timeout in seconds has been reached.
   * @param chatSenderId ChatId where the message comes from
   * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
   * @param regexExpectingFormat  A small object giving the regex and the error message to be sent to the user if the message does not match the expected format
   * @param timeout  Time in seconds to wait for the user to respond
   * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
   * @returns  The message sent by the user
   */
  public async WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(chatSenderId: string, participantId: string, regexExpectingFormat: WaitTextRegexFormat, timeout: number = 30): Promise<string> {
    let isValidResponse: boolean = false;
    let userResult: string;
    do {
      userResult = await this.WaitNextTxtMsgFromUserId(chatSenderId, participantId, timeout);
      if (regexExpectingFormat.regex.test(userResult))
        isValidResponse = true
      else {
        await this.SendTxtToChatId(chatSenderId, regexExpectingFormat.incorrectMsg || "No has respondido con un formato válido, intenta de nuevo...");
      }
    } while (!isValidResponse);
    return userResult;
  }

}

// export class SpecificBot {
//   private bot: Bot;
//   private specificChatArgs: BotCommandArgs;
//   constructor(bot, specificArgs) {
//     this.bot = bot;
//     this.specificChatArgs = specificArgs;
//   }
//   async SendTxt(msg: string): Promise<void> {
//     await this.bot.SendTxtToChatId(this.specificChatArgs.chatId, msg);
//   }
//   async SendImg(imgPath: string, caption?: string): Promise<void> {
//     await this.bot.SendImgToChatId(this.specificChatArgs.chatId, imgPath, caption);
//   }
//   async WaitNextTxtMsgFromSender(timeout?: number): Promise<string> {
//     // return await this.bot.Wat
//   }
// }