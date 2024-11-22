import makeWASocket, { DisconnectReason, proto } from "@whiskeysockets/baileys";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

import AllCommands from "./commands/A_Index";

import type { BaileysWASocket, ICommand } from "./botTypes";
import { MsgType, SenderType } from "./botTypes";

import fs from "fs";

type BotArgs = {
  prefix?: string;
  /** CoolTime in seconds for every response */
  coolDownTime?: number;
};

export default class Bot {
  private prefix: string;
  private Commands: Record<string, ICommand>;
  private socket: BaileysWASocket;
  private credentialsStoragePath: string;
  private thisBot: Bot;
  private coolDowns: Map<string, number>;
  private coolDownTime: number;

  constructor(args: BotArgs | undefined) {
    this.coolDownTime = 1000 * 1; // 1 Second
    this.coolDowns = new Map<string, number>();
    this.Commands = {};
    this.thisBot = this;    
    this.prefix = "!";
    this.credentialsStoragePath = "./auth_info";

    if (args) {
      if (args.prefix) this.prefix = args.prefix;
      if (args.coolDownTime) this.coolDownTime = args.coolDownTime * 1000;
    } 

    AllCommands.forEach((command) => {
      const commandInstance = new command();
      this.Commands[commandInstance.commandName] = commandInstance;
    });
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

          console.log(
            "connection closed due to ",
            disconect.error,
            ", reconnecting ",
            shouldReconnect
          );

          // reconnect if not logged out
          if (shouldReconnect) this.StartBot(); ///This is async, returns a promise!
        }
 
        case "open": {
          console.log("Opened connection");
        }
      }
    });

    // Manejar mensajes entrantes
    this.socket.ev.on("messages.upsert", async (messageUpdate) => {
      if (!messageUpdate.messages) return;


      messageUpdate.messages.forEach((msg) => {
        console.log(msg);
        if (!msg.message && !msg.key.fromMe) return;

        let msgType: MsgType;
        const chatId = msg.key.remoteJid!; // Can be null | undefined for some reason

        let senderType: SenderType = SenderType.Individual;
        if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;

        //---------------- is it a text msg with a command inside?
        const objMsg = msg.message!;

        if (objMsg.imageMessage)
          msgType = MsgType.image;
        else if (objMsg.videoMessage)
          msgType = MsgType.video;
        else if (objMsg.audioMessage)
          msgType = MsgType.audio;
        else if (objMsg.stickerMessage)
          msgType = MsgType.sticker;
        else if (objMsg.conversation || objMsg.extendedTextMessage)
          msgType = MsgType.text;
        else
          msgType = MsgType.unknown;

        ///This can be undefined for some reason
        const msgWords: string[] = objMsg.extendedTextMessage ? objMsg.extendedTextMessage.text?.split(" ")! : objMsg.conversation?.split(" ")!; 
        if (msgWords && msgWords[0].startsWith(this.prefix)) {
          msgType = MsgType.text;

          const now = Date.now();
          
          const lastCommandtime: number|undefined = this.coolDowns.get(chatId);
          if (lastCommandtime && now - lastCommandtime < this.coolDownTime) {
            // If enters here, the sender did not wait the cool down time
            this.SendMsg(chatId, "Hay Cooldown mi compa...");
            return;
          }
          this.coolDowns.set(chatId, now);

          const isACommand = this.Commands[msgWords[0].slice(1)];
          if (isACommand) {
            isACommand.onMsgReceived( ///This is async, returns a promise!
              this.thisBot,
              msg,
              senderType,
              msgType
            );
          }
        }
      });
    });
  }

  private async innerStartupSocket() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

    // Crear socket
    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Genera QR en la terminal
    });
  }

  public async SendMsg(msgIdJSR: string, textToSend: string) {
    await this.socket.sendMessage(msgIdJSR, { text: textToSend });
  }

  public async SendImg(msgIdJSR: string, imgPath: string, captionTxt?:string) {
    await this.socket.sendMessage(msgIdJSR, {
      image: fs.readFileSync(imgPath),
      caption: captionTxt || ''
    })
  }
}
