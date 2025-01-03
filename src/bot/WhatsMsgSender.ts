import { Str_NormalizeLiteralString } from '../utils/strings';
import WhatsSocket from './WhatsSocket';
import WhatsSendingMsgQueue from './WhatsSocketMsgQueue';
import fs from "fs";
import { MiscMessageGenerationOptions, WAMessage } from "@whiskeysockets/baileys";

export class WhatsMsgSender {
  private queue: WhatsSendingMsgQueue;
  constructor(socket: WhatsSocket, maxSendingQueueLimit: number = 5, timeBetweenMsgsInMiliseconds: number = 1000) {
    this.queue = new WhatsSendingMsgQueue(socket, maxSendingQueueLimit, timeBetweenMsgsInMiliseconds);
  }
  public async Text(chatId: string, text: string, sanitizeText:boolean = true, options?: MiscMessageGenerationOptions) {
    text = sanitizeText ? Str_NormalizeLiteralString(text) : text;
    await this.queue.Enqueue(chatId, { text }, options);
  }

  public async Img(chatId: string, imagePath: string, caption?: string, sanitizeCaption: boolean = true, options?: MiscMessageGenerationOptions) {
    const captionToSend = sanitizeCaption ? Str_NormalizeLiteralString(caption) : caption;
    await this.queue.Enqueue(chatId, {
      image: fs.readFileSync(imagePath),
      caption: captionToSend || '',
    }, options);
  }

  public async ReactEmojiTo(chatId: string, originalRawMsg: WAMessage, emojiStr: string){
    await this.queue.Enqueue(chatId, {
      react: {
        text: emojiStr,
        key: originalRawMsg.key
      }
    })
  }
}

