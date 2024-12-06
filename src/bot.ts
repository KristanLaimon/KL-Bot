import makeWASocket, { AnyMessageContent, Contact, DisconnectReason, MessageUpsertType, MiscMessageGenerationOptions, proto, WAMessage } from "@whiskeysockets/baileys";
import type { BaileysWASocket, BotWaitMessageError, ICommand, WaitTextRegexFormat } from "./types/bot_types";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { GetTextFromRawMsg } from './bot_utils';
import { MsgType, SenderType } from "./types/bot_types";
import SocketMessageQueue from './bot_queue';
import * as botUtils from './bot_utils';
import { Boom } from "@hapi/boom";
import fs from "fs";
import Kldb from './kldb';
export type BotUtilsObj = typeof botUtils;

type BaileysInsertArgs = {
  messages: WAMessage[];
  type: MessageUpsertType;
  requestId?: string;
}

type BotArgs = {
  prefix?: string;
  /** CoolTime in seconds for every response */
  coolDownTime?: number;
  maxQueueMsgs?: number;
  shouldConsiderRoles?: boolean;
};

export default class Bot {
  private socket: BaileysWASocket;
  private prefix: string;
  private _commands: Record<string, ICommand>;
  private thisBot: Bot;
  private _shouldConsiderRoles: boolean;
  private credentialsStoragePath: string;


  /** CoolDown between meesages in seconds */
  private coolDownTime: number;

  /** Max quantity of msgs to handle at the same time */
  private maxQueueMsgs: number;

  private msgQueue: SocketMessageQueue;

  get Commands() {
    return Object.entries(this._commands);
  }

  constructor(args: BotArgs | undefined) {
    this.coolDownTime = 1000 * (args?.coolDownTime || 1); // 1 Second
    this._commands = {};
    this.thisBot = this;
    this.prefix = args?.prefix || "!";
    this.maxQueueMsgs = args?.maxQueueMsgs || 10;
    this._shouldConsiderRoles = args?.shouldConsiderRoles || true; // True by default
    this.credentialsStoragePath = "./auth_info";
    this.WaitRawMessageFrom.bind(this, 'NO ID THIS COMES FROM BIND()', 30000);
  }

  public AddCommand(commandObj: ICommand) {
    this._commands[commandObj.commandName] = commandObj;
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

      messageUpdate.messages.forEach(async (msg) => {
        console.log(msg);
        if (!msg.message || msg.key.fromMe) return;
        let msgType: MsgType;
        const chatId = msg.key.remoteJid!; // Can be null | undefined for some reason
        let senderType: SenderType = SenderType.Individual;
        if (chatId && chatId.endsWith("@g.us")) senderType = SenderType.Group;
        if (chatId && chatId.endsWith("@s.whatsapp.net")) senderType = SenderType.Individual;
        const objMsg = msg.message!; // Same as 3 lines above

        ///This can be undefined for some reason
        const msgWords: string[] = objMsg.extendedTextMessage ? objMsg.extendedTextMessage.text?.split(" ")! : objMsg.conversation?.split(" ")!;
        if (msgWords && msgWords[0].startsWith(this.prefix)) {
          msgType = MsgType.text;
          const isACommand = this._commands[msgWords[0].slice(this.prefix.length).toLowerCase()]; ///Is removing the ! in the beginning of the word....

          //Member users or admins with admins commands
          if (isACommand) {
            //TODO: This logic already exists in isAdminUser() util method, replace it!
            //Check is user has privileges to use this (administrator||secret) command
            if (isACommand.roleCommand === "Administrador" || isACommand.roleCommand === "Secreto") {
              let senderIsAnAdminAsWell: boolean = false;
              try {
                const phoneNumber = await botUtils.GetPhoneNumberFromRawmsg(msg)!.fullRawCleanedNumber;
                senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
              } catch (e) {
                senderIsAnAdminAsWell = false;
              }
              if (!senderIsAnAdminAsWell) {
                this.SendText(chatId, "No tienes permisos para ejecutar este comando");
                return;
              }
            }

            isACommand.onMsgReceived(
              this.thisBot,
              {
                msgType: msgType,
                originalPromptMsgObj: msg,
                senderType: senderType,
                chatId: chatId,
                commandArgs: msgWords.slice(1),
                /** If comes from a group, it gets the id from participant */
                /** otherwise, its from an individual chatId */
                userId: msg.key.participant || chatId || "There's no participant, strange error..."
              },
              botUtils
            )
          }
        }
      });
    });
  }

  /**
   * A useful answering handling to expect msg from the user
   * @param chatSenderId Whatsapp ID to the chat the message should deliver
   * @param participantId Whatsapp ID fromthe participant from the previous Chat ID this method should wait for
   * @param expectedMsgType Expected msg, it will validate the message wil be from that type insisting to user to send the expected message type
   * @param timeout Max time in seconds the user has to respond this message, if not, this will raise an error YOU MUST USE TRY CATCH
   * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
   * @returns The message object sent by the user
   */
  public async WaitRawMessageFrom(chatSenderId: string, participantId: string, expectedMsgType: MsgType = MsgType.text, timeout: number = 30): Promise<WAMessage> {
    return new Promise((resolve, reject: (reason: BotWaitMessageError) => void) => {
      const timeoutMsg = "User didn't respond in specified time: " + timeout + " seconds";
      const originalChat = chatSenderId;
      const originalSender = participantId;

      let timerOut: NodeJS.Timeout;

      const resetTimeout = () => {
        clearTimeout(timerOut);
        timerOut = setTimeout(() => {
          this.socket.ev.off("messages.upsert", listener);
          reject({ wasAbortedByUser: false, errorMessage: timeoutMsg });
        }, timeout * 1000);
      };

      const listener = async (messageEvent: BaileysInsertArgs) => {
        for (const msg of messageEvent.messages) {

          if (msg.key.fromMe) continue;

          if ((msg.key.participant || msg.key.remoteJid) !== originalSender) continue;
          if (msg.key.remoteJid !== originalChat) continue;

          // Reset the timeout on any user response
          resetTimeout();

          if (GetTextFromRawMsg(msg).includes('cancelar')) {
            this.socket.ev.off("messages.upsert", listener);
            clearTimeout(timerOut);
            reject({ wasAbortedByUser: true, errorMessage: timeoutMsg });
            return;
          }

          const msgType = botUtils.GetMsgTypeFromRawMsg(msg);
          if (msgType !== expectedMsgType) {
            await this.SendText(chatSenderId, `Formato Incorrecto: Tienes que responder con ${botUtils.MsgTypeToString(expectedMsgType)}`);
            continue; // Keep listening for the correct response
          }

          // Valid response
          this.socket.ev.off("messages.upsert", listener);
          clearTimeout(timerOut);
          resolve(msg);
          return;
        }
      };

      // Set initial timeout
      resetTimeout();

      // Start listening for messages
      this.socket.ev.on("messages.upsert", listener);
    });
  }

  /**
   * Expect a TEXT message from the user (Doesn't matter the format)
   * max message timeout in seconds has been reached.
   * @param chatSenderId ChatId where the message comes from
   * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
   * @param timeout  Time in seconds to wait for the user to respond
   * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
   * @returns  The message sent by the user
   */
  public async WaitTextMessageFrom(chatSenderId: string, participantId: string, timeout: number = 30): Promise<string> {
    return botUtils.GetTextFromRawMsg(await this.WaitRawMessageFrom(chatSenderId, participantId, MsgType.text, timeout));
  }

  /**
   * Expect a TEXT message from the user with a specific format (with regex) or throws error if user cancel the operation or 
   * max message timeout in seconds has been reached.
   * @param chatSenderId ChatId where the message comes from
   * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
   * @param regexExpectingFormat  A small object giving the regex and the error message to be sent to the user if the message does not match the expected format
   * @param timeout  Time in seconds to wait for the user to respond
   * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
   * @returns  The message sent by the user
   */
  public async WaitSpecificTextMessageFrom(chatSenderId: string, participantId: string, regexExpectingFormat: WaitTextRegexFormat, timeout: number = 30): Promise<string> {
    let isValidResponse: boolean = false;
    let userResult: string;
    do {

      userResult = await this.WaitTextMessageFrom(chatSenderId, participantId, timeout);
      if (regexExpectingFormat.regex.test(userResult))
        isValidResponse = true
      else {
        await this.SendText(chatSenderId, regexExpectingFormat.incorrectMsg);
      }
    } while (!isValidResponse);
    return userResult;
  }

  public async SendText(msgIdJSR: string, textToSend: string) {
    await this.SendObjMsg(msgIdJSR, { text: textToSend });
  }

  public async SendObjMsg(msgIdJSR: string, content: AnyMessageContent, misc?: MiscMessageGenerationOptions) {
    await this.msgQueue.AddMsg(msgIdJSR, content, misc);
  }

  public async SendImg(msgIdJSR: string, imgPath: string, captionTxt?: string) {
    this.SendObjMsg(msgIdJSR, {
      image: fs.readFileSync(imgPath),
      caption: captionTxt || ''
    });
  }

  /**
   * @param whatsappID This must be like 6122398392@whatsapp.net OR ending with "@g.us"!
   */
  public async GetContactFromId(whatsappID: string): Promise<Contact | null> {
    const existsUserList = await this.socket.onWhatsApp(whatsappID);
    if (existsUserList.length == 0) return null;

    const jidUser = existsUserList.at(0)!.jid;
    const contact = this.whatsData.contacts[jidUser];

    if (contact) return contact; else return null;
  }

  private async innerStartupSocket() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    this.socket = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Genera QR en la terminal
    });
    this.msgQueue = new SocketMessageQueue(this.socket, this.maxQueueMsgs, this.coolDownTime);
    this.socket.ev.on("creds.update", saveCreds);
  }
}

