import fs from 'fs';

import { GroupMetadata, WAMessage } from '@whiskeysockets/baileys';
import { BotWaitMessageError } from '../types/bot';
import { MsgType, SenderType } from '../types/commands';
import WhatsSocket from './WhatsSocket';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError, Msg_MsgTypeToString } from '../utils/rawmsgs';
import { Phone_GetFullPhoneInfoFromRawMsg } from '../utils/phonenumbers';

type SuccessConditionCallback = (chatId: string, incomingRawMsg: WAMessage, incomingMsgType: MsgType, incomingSenderType: SenderType) => boolean;

export class WhatsMsgReceiver {
  private _whatsSocket: WhatsSocket;

  constructor(socket: WhatsSocket) {
    this._whatsSocket = socket;
  }

  private _waitNextMsg(successConditionCallback: SuccessConditionCallback, chatSenderId: string, userSenderId: string, expectedMsgType: MsgType, timeout: number = 30, wrongTypeMsgFeedback?: string): Promise<WAMessage> {
    if (!wrongTypeMsgFeedback)
      wrongTypeMsgFeedback = "Formato incorrecto: Deberías de responder con " + Msg_MsgTypeToString(expectedMsgType);

    return new Promise((resolve, reject: (reason: BotWaitMessageError) => void) => {
      let timer: NodeJS.Timeout;
      const resetTimeout = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          this._whatsSocket.onIncommingMessage.Unsubsribe(listener);
          reject({ wasAbortedByUser: false, errorMessage: "User didn't responded in time" });
        }, timeout * 1000);
      }

      const listener = (chatId: string, msg: WAMessage, msgType: MsgType, senderType: SenderType) => {
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid !== chatSenderId) return;

        resetTimeout();

        if (Msg_GetTextFromRawMsg(msg).length > 1000) {
          this._whatsSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: false, errorMessage: "User has sent too much text" });
          return;
        }

        if (Msg_GetTextFromRawMsg(msg).toLowerCase().includes('cancelar')) {
          this._whatsSocket.onIncommingMessage.Unsubsribe(listener);
          clearTimeout(timer);
          reject({ wasAbortedByUser: true, errorMessage: "User has canceled the dialog" });
          return;
        }

        if (!successConditionCallback(chatId, msg, msgType, senderType)) return;

        if (msgType !== expectedMsgType) {
          this._whatsSocket.Send(chatId, { text: wrongTypeMsgFeedback })
          return;
        }

        this._whatsSocket.onIncommingMessage.Unsubsribe(listener);
        clearTimeout(timer);
        resolve(msg);
        return;
      }
      //Set initial timeout
      resetTimeout();

      // Start listening for msgs
      this._whatsSocket.onIncommingMessage.Subscribe(listener);
    });
  }

  public async WaitNextRawMsgFromId(chatSenderId: string, userSenderId: string, expectedMsgType: MsgType, timeout?: number, wrongTypeMsgFeedback?: string): Promise<WAMessage> {
    const cb: SuccessConditionCallback = (chatId, msg, msgType, senderType) => ((msg.key.participant || msg.key.remoteJid) === userSenderId);
    return await this._waitNextMsg(cb, chatSenderId, userSenderId, expectedMsgType, timeout, wrongTypeMsgFeedback);
  }

  public async WaitNextRawMsgFromWhatsId(chatSenderId: string, userSenderId: string, expectedWhatsId: string, expectedMsgType: MsgType, timeout?: number, wrongTypeMsgFeedback?: string): Promise<WAMessage> {

    const cb: SuccessConditionCallback = (chatId, msg, msgType, senderType) => {
      const actualWhatsId = Phone_GetFullPhoneInfoFromRawMsg(msg)!.whatsappId;
      return actualWhatsId === expectedWhatsId;
    }
    return await this._waitNextMsg(cb, chatSenderId, userSenderId, expectedMsgType, timeout, wrongTypeMsgFeedback);
  }

  public async WaitUntilRawTxtMsgFromWhatsId(chatSenderId: string, userSenderId: string, expectedCleanedWhatsappId: string, regexExpected: RegExp, timeout?: number, wrongTypeMsgFeedback?: string): Promise<WAMessage> {
    const cb: SuccessConditionCallback = (chatId, msg, msgType, senderType) => {
      if (msgType !== MsgType.text) return false;
      const actualWhatsId = Phone_GetFullPhoneInfoFromRawMsg(msg)!.whatsappId;
      const msgTxt = Msg_GetTextFromRawMsg(msg);
      const isFromExpectedPhoneUser = actualWhatsId === expectedCleanedWhatsappId;
      const isMsgFormatExpected = regexExpected.test(msgTxt);
      return isFromExpectedPhoneUser && isMsgFormatExpected;
    }
    return await this._waitNextMsg(cb, chatSenderId, userSenderId, MsgType.text, timeout, wrongTypeMsgFeedback);
  }

  public async GetGroupMetadata(chatSenderId: string): Promise<GroupMetadata | null> {
    return await this._whatsSocket.GetGroupMetadata(chatSenderId);
  }
}