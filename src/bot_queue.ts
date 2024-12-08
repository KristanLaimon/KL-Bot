import { AnyMessageContent, MiscMessageGenerationOptions } from '@whiskeysockets/baileys';
import { BaileysWASocket } from './types/bot';

export type SocketMsgQueueItem = {
  chatId: string,
  content: AnyMessageContent,
  misc?: MiscMessageGenerationOptions,
  resolve: (result: any) => void,
  reject: (reason: any) => void,
}

/**
 * TODO: This is the global queue msg queue. It's used to handle all messages that are sent to the user.
 * IT'S global, applies for all messages from all chats the bot is included in. If in some point
 * this becomes a problem, we can always make it per chat and using multithreading.
 */
export default class SocketMessageQueue {
  private queue: SocketMsgQueueItem[] = [];
  private isProcessing: boolean = false;
  private socket: BaileysWASocket;
  /** In miliseconds */
  private minDelay: number;
  private maxQueueLimit: number;


  constructor(socket: BaileysWASocket, maxQueueLimit: number = 3, minDelay: number = 1000) {
    this.socket = socket;
    this.minDelay = minDelay;
    this.maxQueueLimit = maxQueueLimit;
  }

  async AddMsg(chatId: string, content: AnyMessageContent, misc?: MiscMessageGenerationOptions): Promise<void> {
    if (this.queue.length >= this.maxQueueLimit) return;

    return new Promise((resolve, reject) => {
      this.queue.push({ chatId, content, misc, resolve, reject });
      this.ProcessQueue(); //I don't need to wait, do i?

      if (!this.isProcessing) {
        this.isProcessing = true;
      }
    })
  }

  private async ProcessQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const { chatId, content, misc, resolve, reject } = this.queue.shift()!;
    try {
      await this.socket.sendMessage(chatId, content, misc);
      resolve(true);
    }
    catch (error) {
      reject(error);
    }
    await new Promise(resolve => setTimeout(resolve, this.minDelay));

    this.isProcessing = false;
    this.ProcessQueue();
  }
}