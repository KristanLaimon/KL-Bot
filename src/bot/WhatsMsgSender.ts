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

  /**
   * Sends a text message to the specified chat.
   *
   * @param chatId - The ID of the chat where the message will be sent.
   * @param text - The text message to be sent.
   * @param sanitizeText - A boolean indicating whether to sanitize the text or not. Defaults to true.
   * @param options - Miscellaneous message generation options.
   * @param mentionsIds - Array of IDs of users to mention in the message. The 'text' must contain '@' characters in the same order as this array.
   * @returns A promise that resolves when the text message has been sent successfully.
   */
  public async Text(chatId: string, text: string, sanitizeText:boolean = true, options?: MiscMessageGenerationOptions, mentionsIds?: string[]) {
    text = sanitizeText ? Str_NormalizeLiteralString(text) : text;
    await this.queue.Enqueue(chatId, { text, mentions: mentionsIds }, options);
  }

  public async Img(chatId: string, imagePath: string, caption?: string, sanitizeCaption: boolean = true, options?: MiscMessageGenerationOptions, mentionIds?:string[]) {
    const captionToSend = sanitizeCaption ? Str_NormalizeLiteralString(caption) : caption;
    await this.queue.Enqueue(chatId, {
      image: fs.readFileSync(imagePath),
      caption: captionToSend || '',
      mentions: mentionIds
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

