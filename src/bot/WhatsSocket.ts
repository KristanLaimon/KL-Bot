import makeWASocket, { AnyMessageContent, DisconnectReason, MiscMessageGenerationOptions, useMultiFileAuthState, WAMessage } from '@whiskeysockets/baileys';
import { BaileysWASocket } from '../types/bot';
import { Boom } from "@hapi/boom";
import { MsgType, SenderType } from '../types/commands';
import P from "pino";

export class Delegate<functType extends (...args: any[]) => any> {
  private functions: functType[] = [];
  public Subscribe(funct: functType): void {
    this.functions.push(funct);
  }
  public Unsubsribe(funct: functType): boolean {
    const foundFunctIndex = this.functions.findIndex(f => f === funct);
    if (foundFunctIndex === -1) return false;
    this.functions.splice(foundFunctIndex, 1);
    return true;
  }
  public CallAll(...args: Parameters<functType>) {
    this.functions.forEach(f => f(...args));
  }
}

export default class WhatsSocket {
  private socket: BaileysWASocket; //It's initialized in "initializeSelf"
  public onReconnect: Delegate<() => void> = new Delegate();
  public onIncommingMessage: Delegate<(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) => void> = new Delegate();

  constructor() {
    this.InitializeSelf().then(() => {
      this.ConfigureReconnection();
      this.ConfigureMessageIncoming();
    })
  }

  private async InitializeSelf() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Genera QR en la terminal
      ///@ts-ignore
      logger: P({ level: "debug" })
    });
    this.socket.ev.on("creds.update", saveCreds);
  }

  private ConfigureReconnection() {
    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      const disconect = lastDisconnect!;

      switch (connection) {
        case "close": {
          const shouldReconnect =
            (disconect.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;
          if (shouldReconnect) this.onReconnect.CallAll();
        }
      }
    });
  }

  private ConfigureMessageIncoming() {
    this.socket.ev.on("messages.upsert", async (messageUpdate) => {
      if (!messageUpdate.messages) return;
      messageUpdate.messages.forEach(async (msg) => {
        // console.log(msg);
        if (!msg.message || msg.key.fromMe) return;
        const chatId = msg.key.remoteJid!;

        let senderType: SenderType = SenderType.Individual;
        if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;
        if (chatId && chatId.endsWith("@s.whatsapp.net")) senderType = SenderType.Individual;
        this.onIncommingMessage.CallAll(chatId, msg, GetMsgTypeFromRawMsg(msg), senderType);
      });
    });
  }

  public async Send(chatId_JID: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) {
    await this.socket.sendMessage(chatId_JID, content, options);
  }
}

export function GetMsgTypeFromRawMsg(rawMsg: WAMessage): MsgType {
  if (!rawMsg.message) return MsgType.unknown;
  const objMsg = rawMsg.message;
  if (objMsg.imageMessage)
    return MsgType.image;
  else if (objMsg.videoMessage)
    return MsgType.video;
  else if (objMsg.audioMessage)
    return MsgType.audio;
  else if (objMsg.stickerMessage)
    return MsgType.sticker;
  else if (objMsg.conversation || objMsg.extendedTextMessage)
    return MsgType.text;
  else
    return MsgType.unknown;
}

// case "open": {
//   //console.log("Opened connection");
// }

// const objMsg = msg.message!; // Same as 3 lines above

// ///This can be undefined for some reason
// const msgWords: string[] = objMsg.extendedTextMessage ? objMsg.extendedTextMessage.text?.split(" ")! : objMsg.conversation?.split(" ")!;
// if (msgWords && msgWords[0].startsWith(this.prefix)) {
//   msgType = MsgType.text;
//   const isACommand = this._commands[msgWords[0].slice(this.prefix.length).toLowerCase()]; ///Is removing the ! in the beginning of the word....

//   //Member users or admins with admins commands
//   if (isACommand) {
//     //TODO: This logic already exists in isAdminUser() util method, replace it!
//     //Check is user has privileges to use this (administrator||secret) command
//     if (isACommand.roleCommand === "Administrador" || isACommand.roleCommand === "Secreto") {
//       let senderIsAnAdminAsWell: boolean = false;
//       try {
//         const phoneNumber = await allUtils.PhoneNumber.GetPhoneNumberFromRawmsg(msg)!.fullRawCleanedNumber;
//         senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
//       } catch (e) {
//         senderIsAnAdminAsWell = false;
//       }
//       if (!senderIsAnAdminAsWell) {
//         this.SendTxtToChatId(chatId, "No tienes permisos para ejecutar este comando");
//         return;
//       }
//     }

//     isACommand.onMsgReceived(
//       this.thisBot,
//       {
//         msgType: msgType,
//         originalPromptMsgObj: msg,
//         senderType: senderType,
//         chatId: chatId,
//         commandArgs: msgWords.slice(1),
//         /** If comes from a group, it gets the id from participant */
//         /** otherwise, its from an individual chatId */
//         userId: msg.key.participant || chatId || "There's no participant, strange error..."
//       },
//       allUtils
//     )
//   }
// }