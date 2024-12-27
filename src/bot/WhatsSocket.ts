import makeWASocket, { AnyMessageContent, DisconnectReason, GroupMetadata, MiscMessageGenerationOptions, useMultiFileAuthState, WAMessage } from '@whiskeysockets/baileys';
import { BaileysWASocket } from '../types/bot';
import { Boom } from "@hapi/boom";
import { MsgType, SenderType } from '../types/commands';
import { Msg_GetMsgTypeFromRawMsg } from '../utils/rawmsgs';
import KlLogger from './logger';
import moment from 'moment';

export class Delegate<functType extends (...args: any[]) => any> {
  private functions: functType[] = [];

  public get Length(): number {
    return this.functions.length;
  }

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
  public onEnteringGroup: Delegate<(groupInfo: GroupMetadata) => void> = new Delegate();

  constructor() { }

  public async Init() {
    await this.InitializeSelf();
    this.ConfigureReconnection();
    this.ConfigureMessageIncoming();
    this.ConfigureEnteringGroups();
  }

  private async InitializeSelf() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Genera QR en la terminal
    });
    this.socket.ev.on("creds.update", saveCreds);
  }


  private ConfigureReconnection(): void {
    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      const disconect = lastDisconnect!;

      switch (connection) {
        case "close": {
          const shouldReconnect =
            (disconect.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;
          KlLogger.info('Connection closed, reconnecting...');
          if (shouldReconnect) this.onReconnect.CallAll();
        }
      }
    });
  }

  private ConfigureEnteringGroups(): void {
    this.socket.ev.on('groups.upsert', async (groupsUpserted: GroupMetadata[]) => {
      for (const group of groupsUpserted) {
        this.onEnteringGroup.CallAll(group);
        KlLogger.info(`Joined to a new group ${group.subject} at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      }
    })
  }

  private ConfigureMessageIncoming(): void {
    this.socket.ev.on("messages.upsert", async (messageUpdate) => {
      if (!messageUpdate.messages) return;
      messageUpdate.messages.forEach(async (msg) => {
        // console.log(msg);
        if (!msg.message || msg.key.fromMe) return;
        const chatId = msg.key.remoteJid!;

        let senderType: SenderType = SenderType.Individual;
        if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;
        if (chatId && chatId.endsWith("@s.whatsapp.net")) senderType = SenderType.Individual;
        this.onIncommingMessage.CallAll(chatId, msg, Msg_GetMsgTypeFromRawMsg(msg), senderType);
      });
    });
  }

  public async Send(chatId_JID: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) {
    await this.socket.sendMessage(chatId_JID, content, options);
  }

  public async GetGroupMetadata(chatId: string): Promise<GroupMetadata | null> {
    if (!chatId.endsWith("@g.us")) return null;
    return await this.socket.groupMetadata(chatId);
  }
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