import makeWASocket, { AnyMessageContent, DisconnectReason, MessageUpsertType, MiscMessageGenerationOptions, proto, WAMessage } from "@whiskeysockets/baileys";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import AllCommands from "./commands/A_Index";
import type { BaileysWASocket, BotWaitMessageError, ICommand } from "./botTypes";
import { MsgType, SenderType } from "./botTypes";
import fs from "fs";
import { GetTextFromRawMsg } from './utils/Msg';

type BaileysInsertArgs = {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
}

type BotArgs = {
  prefix?: string;
  /** CoolTime in seconds for every response */
  coolDownTime?: number;
};

type FlowCallBack = (bot:Bot, message:WAMessage, waitMessage:(chatId:string, message:WAMessage)=>Promise<string>) => Promise<void>;

export default class Bot {
  private prefix: string;
  private _commands: Record<string, ICommand>;
  private socket: BaileysWASocket;
  private credentialsStoragePath: string;
  private thisBot: Bot;
  private coolDowns: Map<string, number>;
  private coolDownTime: number;
  
  get Commands() {
    return Object.entries(this._commands);
  }

  constructor(args: BotArgs | undefined) {
    this.coolDownTime = 1000 * 1; // 1 Second
    this.coolDowns = new Map<string, number>();
    this._commands = {};
    this.thisBot = this;    
    this.prefix = "!";
    this.credentialsStoragePath = "./auth_info";

    if (args) {
      if (args.prefix) this.prefix = args.prefix;
      if (args.coolDownTime) this.coolDownTime = args.coolDownTime * 1000;
    } 

    AllCommands.forEach((command) => {
      const commandInstance = new command();
      this._commands[commandInstance.commandName] = commandInstance;
    });

    this.WaitMessageFrom.bind(this, 'NO ID THIS COMES FROM BIND()', 30000);
  }

  public async StartBot() {
    await this.innerStartupSocket();

    // Manejar eventos de conexión
    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      const disconect = lastDisconnect!;

      switch (connection) {
        case "close": {
          const shouldReconnect =
            (disconect.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          /* console.log(
            "connection closed due to ",
            disconect.error,
            ", reconnecting ",
            shouldReconnect
          ) */;

          // reconnect if not logged out
          if (shouldReconnect) this.StartBot(); ///This is async, returns a promise!
        }
 
        case "open": {
          //console.log("Opened connection");
        }
      }
    });

    // Manejar mensajes entrantes
    this.socket.ev.on("messages.upsert", async (messageUpdate) => {
      if (!messageUpdate.messages) return;

      messageUpdate.messages.forEach((msg) => {
        console.log(msg);
        if (!msg.message || msg.key.fromMe) return;
        let msgType: MsgType;
        const chatId = msg.key.remoteJid!; // Can be null | undefined for some reason
        let senderType: SenderType = SenderType.Individual;
        if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;
        const objMsg = msg.message!; // Same as 3 lines above

        ///This can be undefined for some reason
        const msgWords: string[] = objMsg.extendedTextMessage ? objMsg.extendedTextMessage.text?.split(" ")! : objMsg.conversation?.split(" ")!; 
        if (msgWords && msgWords[0].startsWith(this.prefix)) {
          msgType = MsgType.text;

          const now = Date.now();
          const lastCommandtime: number|undefined = this.coolDowns.get(chatId);
          if (lastCommandtime && now - lastCommandtime < this.coolDownTime) {
            // If enters here, the sender did not wait the cool down time
            this.SendText(chatId, "Hay Cooldown mi compa...");
            return;
          }
          this.coolDowns.set(chatId, now);

          const isACommand = this._commands[msgWords[0].slice(1)]; ///Is removing the ! in the beginning of the word....
          if (isACommand) {
            isACommand.onMsgReceived(
              this.thisBot,
              {
                msgType: msgType,
                msgObj: msg,
                senderType: senderType,
                chatSenderId: chatId,
                commandArgs: msgWords.slice(1),
                userSenderId: msg.key.participant || "There's no participant, strange error..."
              }
            )
          }
        }
      });
    });
  }

  public async WaitMessageFrom(chatSenderId: string, participantId: string,  timeout:number = 30000):Promise<WAMessage> {
    return new Promise((resolve, reject: (resason: BotWaitMessageError) => void) => {
      const timeoutMsg = "User didn't respond in specified time: " + timeout / 1000 + " seconds";
      let isRedundantSenderMessage = true;

      const originalSender = participantId;

      console.log("Original Sender: " + originalSender);

      const listener = (messageEvent: BaileysInsertArgs) => {
        messageEvent.messages.forEach(msg => {
          if (!msg.key.fromMe && msg.key.participant! == originalSender && !isRedundantSenderMessage) {
            console.log("IncomingSender: " + msg.key.remoteJid + " OriginalSender: " + originalSender);
            this.socket.ev.off("messages.upsert", listener);
            clearTimeout(timerOut);
            if (GetTextFromRawMsg(messageEvent.messages[0]).includes('para')) {
              reject({wasAbortedByUser: true, errorMessage: timeoutMsg});
            } else {
              resolve(msg);
            }
          }
        })
        isRedundantSenderMessage = false
      }

      const timerOut = setTimeout(() => {
        this.socket.ev.off("messages.upsert", listener)
        reject({wasAbortedByUser: false, errorMessage: timeoutMsg});
      }, timeout);

      this.socket.ev.on("messages.upsert", listener);
    });
  }

  public async SendText(msgIdJSR: string, textToSend: string) {
    await this.socket.sendMessage(msgIdJSR, { text: textToSend });
  }

  public async SendMsg(msgIdJSR: string, content:AnyMessageContent, misc?:MiscMessageGenerationOptions) {
    await this.socket.sendMessage(msgIdJSR, content, misc);
  }

  public async SendImg(msgIdJSR: string, imgPath: string, captionTxt?:string) {
    await this.socket.sendMessage(msgIdJSR, {
      image: fs.readFileSync(imgPath),
      caption: captionTxt || ''
    })
  }
  
  private async innerStartupSocket() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

    // Crear socket
    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Genera QR en la terminal
    });
  }
}

