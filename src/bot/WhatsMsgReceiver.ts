import { WAMessage } from '@whiskeysockets/baileys';
import { BotWaitMessageError } from '../types/bot';
import { MsgType, SenderType } from '../types/commands';
import WhatsSocket from './WhatsSocket';
import { Msg_GetTextFromRawMsg, Msg_MsgTypeToString } from '../utils/rawmsgs';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../utils/phonenumbers';

export class WhatsMsgReceiver {
  private _rawSocket: WhatsSocket;

  constructor(socket: WhatsSocket) {
    this._rawSocket = socket;
  }

  public WaitNextRawMsgFromId(chatSenderId: string, userSenderId: string, expectedMsgType: MsgType, timeout: number = 30, wrongTypeMsgFeedback?: string): Promise<WAMessage> {
    if (!wrongTypeMsgFeedback)
      wrongTypeMsgFeedback = "Formato incorrecto: Deberías de responder con " + Msg_MsgTypeToString(expectedMsgType);

    return new Promise((resolve, reject: (reason: BotWaitMessageError) => void) => {
      let timer: NodeJS.Timeout;
      const originalSender = userSenderId;
      const originalChat = chatSenderId;


      const resetTimeout = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          reject({ wasAbortedByUser: false, errorMessage: "User didn't responded in time" });
        }, timeout * 1000);
      }

      const listener = (chatId: string, msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
        if (msg.key.fromMe) return;
        if ((msg.key.participant || msg.key.remoteJid) !== originalSender) return;
        if (msg.key.remoteJid !== originalChat) return;
        resetTimeout();

        if (Msg_GetTextFromRawMsg(msg).includes('cancelar')) {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
          return;
        }

        if (msgType !== expectedMsgType) {
          this._rawSocket.Send(chatId, { text: wrongTypeMsgFeedback })
          return;
        }

        this._rawSocket.onIncommingMessage.Unsubsribe(listener);
        clearTimeout(timer);
        resolve(msg);
        return;
      }
      //Set initial timeout
      resetTimeout();

      // Start listening for msgs
      this._rawSocket.onIncommingMessage.Subscribe(listener);
    });
  }

  public WaitNextRawMsgFromPhone(chatSenderId: string, userSenderId: string, expectedCleanedPhoneNumber: string, expectedMsgType: MsgType, timeout: number = 30, wrongTypeMsgFeedback?: string): Promise<WAMessage> {
    if (!wrongTypeMsgFeedback)
      wrongTypeMsgFeedback = "Formato incorrecto: Deberías de responder con " + Msg_MsgTypeToString(expectedMsgType);

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

        if (Msg_GetTextFromRawMsg(msg).includes('cancelar') && (msg.key.participant || msg.key.remoteJid) === userSenderId) {
          this._rawSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User didn't responded in time" });
          return;
        }

        const msgNumber = Phone_GetFullPhoneInfoFromRawmsg(msg)!.number;
        if (msgNumber !== expectedSenderNumber) return;
        resetTimeout();

        if (expectedMsgType !== msgType) {
          this._rawSocket.Send(chatSenderId, { text: wrongTypeMsgFeedback });
          return;
        }

        this._rawSocket.onIncommingMessage.Unsubsribe(listener);
        resolve(msg)
      }
      //Set initial timeout
      resetTimeout();

      // Star listening for messages
      this._rawSocket.onIncommingMessage.Subscribe(listener);
    })
  }


}