import WhatsSocket from './WhatsSocket';
import WhatsSendingMsgQueue from './WhatsSocketMsgQueue';
import fs from "fs";

export class WhatsMsgSender {
  private queue: WhatsSendingMsgQueue;
  constructor(socket: WhatsSocket, maxSendingQueueLimit: number = 5, timeBetweenMsgsInMiliseconds: number = 1000) {
    this.queue = new WhatsSendingMsgQueue(socket, maxSendingQueueLimit, timeBetweenMsgsInMiliseconds);
  }
  public async Text(chatId: string, text: string) {
    text = text.trim().split("\n").map((line) => line.trim() || line).join("\n");
    await this.queue.Enqueue(chatId, { text });
  }

  public async Img(chatId: string, imagePath: string, caption?: string) {
    this.queue.Enqueue(chatId, {
      image: fs.readFileSync(imagePath),
      caption: caption || '',
    });
  }
}

