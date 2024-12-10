import { WAMessage } from '@whiskeysockets/baileys';
import { BotWaitMessageError } from '../types/bot';
import { MsgType, SenderType } from '../types/commands';
import WhatsSocket from './WhatsSocket';
import { GetTextFromRawMsg, MsgTypeToString } from '../utils/rawmsgs';
import { Phone_GetPhoneNumberFromRawmsg } from '../utils/phonenumbers';

export class WhatsMsgReceiver {
  private _rawSocket: WhatsSocket;

  constructor(socket: WhatsSocket) {
    this._rawSocket = socket;
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

      const listener = (chatId: string, msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
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

      const listener = (chatId: string, msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid !== originalChat) return;

        if (GetTextFromRawMsg(msg).includes('cancelar') && (msg.key.participant || msg.key.remoteJid) === userSenderId) {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
          return;
        }

        const msgNumber = Phone_GetPhoneNumberFromRawmsg(msg)!.fullRawCleanedNumber;
        if (msgNumber !== expectedSenderNumber) return;
        resetTimeout();

        if (expectedMsgType !== msgType) {
          this._rawSocket.Send(chatSenderId, { text: wrongTypeMsgFeedback });
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