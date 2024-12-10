import { AnyMessageContent, MiscMessageGenerationOptions, WAMessage } from '@whiskeysockets/baileys';
import { BotWaitMessageError } from '../types/bot';
import { MsgType, SenderType } from '../types/commands';
import WhatsSocket, { Delegate } from './WhatsSocket';
import { GetTextFromRawMsg, MsgTypeToString } from '../utils/rawmsgs';
import { GetPhoneNumberFromRawmsg } from '../utils/phonenumbers';
import WhatsSendingMsgQueue from './WhatsSocketMsgQueue';
import fs from "fs";


class WhatsMsgSender {
  private queue: WhatsSendingMsgQueue;
  constructor(socket: WhatsSocket, maxSendingQueueLimit: number = 5, timeBetweenMsgsInMiliseconds: number = 1000) {
    this.queue = new WhatsSendingMsgQueue(socket, maxSendingQueueLimit, timeBetweenMsgsInMiliseconds);
  }
  public async sendText(chatId: string, text: string) {
    text = text.trim().split("\n").map((line) => line.trim() || line).join("\n");
    await this.queue.Enqueue(chatId, { text });
  }

  public async sendImage(chatId: string, imagePath: string, caption?: string) {
    this.queue.Enqueue(chatId, {
      image: fs.readFileSync(imagePath),
      caption: caption || '',
    });
  }
}

export default class WhatsMsgReceiver {
  private _rawSocket: WhatsSocket;
  private OnWrongTypeMessage: Delegate<(chatId: string, senderId: string, typeGot: MsgType, typeExpected: MsgType) => void>

  constructor(socket: WhatsSocket) {
    this._rawSocket = socket;
    this.OnWrongTypeMessage = new Delegate();
  }

  public WaitNextRawMsgFromId(chatSenderId: string, userSenderId: string, expectedMsgType: MsgType, wrongTypeMsgFeedback?: string, timeout: number = 30): Promise<{ msg: WAMessage, msgType: MsgType, senderType: SenderType }> {
    if (!wrongTypeMsgFeedback)
      wrongTypeMsgFeedback = "Formato incorrecto: Deberías de responder con " + MsgTypeToString(expectedMsgType);

    return new Promise((resolve, reject: (reason: BotWaitMessageError) => void) => {
      let timer: NodeJS.Timeout;
      const originalSender = userSenderId;
      const originalChat = chatSenderId;


      const resetTimeout = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
        }, timeout * 1000);
      }

      const listener = (msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
        if (msg.key.fromMe) return;
        if ((msg.key.participant || msg.key.remoteJid) !== originalSender) return;
        if (msg.key.remoteJid !== originalChat) return;
        resetTimeout();

        if (GetTextFromRawMsg(msg).includes('cancelar')) {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
          return;
        }

        if (msgType !== expectedMsgType) {
          this._rawSocket.Send(chatSenderId, { text: wrongTypeMsgFeedback })
        }

        this._rawSocket.onIncommingMessage.Unsubsribe(listener);
        clearTimeout(timer);
        resolve({ msg, msgType, senderType });
        return;
      }
      //Set initial timeout
      resetTimeout();

      // Start listening for msgs
      this._rawSocket.onIncommingMessage.Subscribe(listener);
    });
  }

  public WaitNextRawMsgFromPhone(chatSenderId: string, userSenderId: string, expectedCleanedPhoneNumber: string, expectedMsgType: MsgType, wrongTypeMsgFeedback?: string, timeout: number = 30): Promise<{ msg: WAMessage, msgType: MsgType, senderType: SenderType }> {
    if (!wrongTypeMsgFeedback)
      wrongTypeMsgFeedback = "Formato incorrecto: Deberías de responder con " + MsgTypeToString(expectedMsgType);

    return new Promise((resolve, reject: (reason: BotWaitMessageError) => void) => {
      const originalChat = chatSenderId;
      const expectedSenderNumber = expectedCleanedPhoneNumber;
      let timer: NodeJS.Timeout;

      const resetTimeout = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
        }, timeout * 1000);
      }

      const listener = (msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid !== originalChat) return;

        if (GetTextFromRawMsg(msg).includes('cancelar') && (msg.key.participant || msg.key.remoteJid) === userSenderId) {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
          return;
        }

        const msgNumber = GetPhoneNumberFromRawmsg(msg)!.fullRawCleanedNumber;
        if (msgNumber !== expectedSenderNumber) return;
        resetTimeout();

        if (expectedMsgType !== msgType) {
          this.msgQueue.Enqueue(chatSenderId, { text: wrongTypeMsgFeedback });
          return;
        }

        this._rawSocket.onIncommingMessage.Unsubsribe(listener);
        resolve({ msg, msgType, senderType })
      }
      //Set initial timeout
      resetTimeout();

      // Star listening for messages
      this._rawSocket.onIncommingMessage.Subscribe(listener);
    })
  }

}