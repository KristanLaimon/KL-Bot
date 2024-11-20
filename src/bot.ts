import makeWASocket, { DisconnectReason, proto } from "@whiskeysockets/baileys";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";

import AllCommands from "./commands/AIndex";
const AllBotCommands = AllCommands as unknown as Command[];

import type { BaileysWASocket, Command } from "./botTypes";
import { MsgType, SenderType } from "./botTypes";

import fs from "fs";

type BotArgs = {
  prefix?: string;
};

export default class Bot {
  private prefix: string;
  private Commands: Record<string, Command>;
  private socket: BaileysWASocket;
  private credentialsStoragePath: string;
  private thisBot: Bot;

  constructor(args: BotArgs | undefined) {
    if (args) {
      if (args.prefix) this.prefix = args.prefix;
    } else {
      this.prefix = "!";
      this.credentialsStoragePath = "./auth_info";
    }

    this.Commands = {};
    this.thisBot = this;

    AllBotCommands.forEach((com) => {
      this.Commands[com.commandName] = com;
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
        if (!msg.message && !msg.key.fromMe) return;

        let msgType: MsgType;
        const jid = msg.key.remoteJid;

        let senderType: SenderType = SenderType.Individual;
        if (jid && jid.endsWith("@g.us")) senderType = SenderType.Group;

        //---------------- It is a text msg with a command inside?
        const msgWords = msg.message?.conversation?.split(" ");
        if (msgWords) {
          msgType = MsgType.text;
          const isACommand = this.Commands[this.prefix + msgWords[0]];
          if (isACommand) {
            isACommand.onMsgReceived(
              this.thisBot,
              msg,
              senderType,
              MsgType.text
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

  public async SendMsg(msgIdJSR: string, textToSend) {
    await this.socket.sendMessage(msgIdJSR, { text: textToSend });
  }
}
