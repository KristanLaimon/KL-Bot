import WhatsSocket from './bot/WhatsSocket';
import { WhatsMsgSender } from './bot/WhatsMsgSender';
import { WhatsMsgReceiver } from './bot/WhatsMsgReceiver';
import CommandsHandler from './bot/Commands';
import { HelperRoleName, ICommand, MsgType, SenderType } from './types/commands';
import { WAMessage } from '@whiskeysockets/baileys';
import { GetTextFromRawMsg } from './utils/rawmsgs';
import { Members_GetMemberInfoFromPhone } from './utils/members';
import { Phone_GetPhoneNumberFromRawmsg } from './utils/phonenumbers';

type BotArgs = {
  prefix?: string;
  coolDownSecondsTime?: number;
  maxQueueMsgs?: number; /** Max quantity of msgs to handle at the same time */
};

export default class Bot {
  private socket: WhatsSocket;
  private config: BotArgs;

  public sender: WhatsMsgSender;
  public receiver: WhatsMsgReceiver;
  public commandHandler: CommandsHandler;

  constructor(args: BotArgs | undefined) {
    this.config = {
      coolDownSecondsTime: 1000 * (args?.coolDownSecondsTime || 1),
      maxQueueMsgs: args?.maxQueueMsgs || 10,
      prefix: args?.prefix || "!",
    };
    this.commandHandler = new CommandsHandler();
  }

  get Commands() {
    return this.commandHandler.Commands;
  }

  public async StartBot() {
    this.socket = new WhatsSocket();
    this.sender = new WhatsMsgSender(this.socket, 5, 1000);
    this.receiver = new WhatsMsgReceiver(this.socket);
    this.socket.onIncommingMessage.Subscribe(this.OnMessageTriggered);
  }

  public AddCommand(commandInstance: ICommand) {
    this.commandHandler.AddCommand(commandInstance);
  }

  private async OnMessageTriggered(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) {
    console.log(rawMsg);
    if (type === MsgType.text) {
      const fullText = GetTextFromRawMsg(rawMsg);

      ///Check if starts with prefix
      if (!fullText.startsWith(this.config.prefix!)) return;

      const words = fullText.trim().split(' ');
      const command = words[0].slice(this.config.prefix!.length).toLowerCase(); //Removes the prefix;
      const args = words.slice(1);

      //Check if command exists
      if (!this.commandHandler.Exists(command)) return;

      //Check if it is registered in bot, an admin?, a member? or neither of them?
      const phoneNumber = Phone_GetPhoneNumberFromRawmsg(rawMsg)!.fullRawCleanedNumber;
      const foundMemberInfo = await Members_GetMemberInfoFromPhone(phoneNumber);
      let roleMember: HelperRoleName;
      if (foundMemberInfo === null) roleMember = "Cualquiera";
      else {
        if (foundMemberInfo.role === "AD") roleMember = "Administrador";
        else roleMember = "Miembro";
      }
      if (!this.commandHandler.HasPermisionToExecute(command, roleMember)) {
        this.sender.sendText(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }
      const userId = rawMsg.participant || chatId || "There's no participant, so strage...";
      this.commandHandler.Execute(command, this, { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userId })



    }
  }
  // type BaileysInsertArgs = {
  //   messages: WAMessage[];
  //   type: MessageUpsertType;
  //   requestId?: string;
  // }
  // this.msgQueue = new SocketMessageQueue(this.socket, this.maxQueueMsgs, this.coolDownTime);

  // /**
  //  * Expect a TEXT message from the user (Doesn't matter the format)
  //  * max message timeout in seconds has been reached.
  //  * @param chatSenderId ChatId where the message comes from
  //  * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
  //  * @param timeout  Time in seconds to wait for the user to respond
  //  * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
  //  * @returns  The message sent by the user
  //  */
  // public async WaitNextTxtMsgFromUserId(chatSenderId: string, participantId: string, timeout: number = 30): Promise<string> {
  //   return allUtils.Msg.GetTextFromRawMsg(await this.WaitNextRawMsgFromId(chatSenderId, participantId, MsgType.text, timeout));
  // }

  // /**
  //  * Expect a TEXT message from the user with a specific format (with regex) or throws error if user cancel the operation or 
  //  * max message timeout in seconds has been reached.
  //  * @param chatSenderId ChatId where the message comes from
  //  * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
  //  * @param regexExpectingFormat  A small object giving the regex and the error message to be sent to the user if the message does not match the expected format
  //  * @param timeout  Time in seconds to wait for the user to respond
  //  * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
  //  * @returns  The message sent by the user
  //  */
  // public async WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(chatSenderId: string, participantId: string, regexExpectingFormat: WaitTextRegexFormat, timeout: number = 30): Promise<string> {
  //   let isValidResponse: boolean = false;
  //   let userResult: string;
  //   do {
  //     userResult = await this.WaitNextTxtMsgFromUserId(chatSenderId, participantId, timeout);
  //     if (regexExpectingFormat.regex.test(userResult))
  //       isValidResponse = true
  //     else {
  //       await this.SendTxtToChatId(chatSenderId, regexExpectingFormat.incorrectMsg || "No has respondido con un formato válido, intenta de nuevo...");
  //     }
  //   } while (!isValidResponse);
  //   return userResult;
  // }

}

// export class SpecificBot {
//   private bot: Bot;
//   private specificChatArgs: BotCommandArgs;
//   constructor(bot, specificArgs) {
//     this.bot = bot;
//     this.specificChatArgs = specificArgs;
//   }
//   async SendTxt(msg: string): Promise<void> {
//     await this.bot.SendTxtToChatId(this.specificChatArgs.chatId, msg);
//   }
//   async SendImg(imgPath: string, caption?: string): Promise<void> {
//     await this.bot.SendImgToChatId(this.specificChatArgs.chatId, imgPath, caption);
//   }
//   async WaitNextTxtMsgFromSender(timeout?: number): Promise<string> {
//     // return await this.bot.Wat
//   }
// }