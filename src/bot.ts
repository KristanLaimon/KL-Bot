import WhatsSocket from './bot/WhatsSocket';
import { WhatsMsgSender } from './bot/WhatsMsgSender';
import { WhatsMsgReceiver } from './bot/WhatsMsgReceiver';
import CommandsHandler from './bot/Commands';
import { HelperRoleName, ICommand, MsgType, SenderType } from './types/commands';
import { WAMessage } from '@whiskeysockets/baileys';
import { Msg_GetTextFromRawMsg } from './utils/rawmsgs';
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

  public Send: WhatsMsgSender;
  public Receive: WhatsMsgReceiver;
  public CommandsHandler: CommandsHandler;

  constructor(args: BotArgs | undefined) {
    this.config = {
      coolDownSecondsTime: 1000 * (args?.coolDownSecondsTime || 1),
      maxQueueMsgs: args?.maxQueueMsgs || 10,
      prefix: args?.prefix || "!",
    };
    this.CommandsHandler = new CommandsHandler();
  }

  get Commands() {
    return this.CommandsHandler.Commands;
  }

  public async StartBot() {
    this.socket = new WhatsSocket();
    this.Send = new WhatsMsgSender(this.socket, 5, 1000);
    this.Receive = new WhatsMsgReceiver(this.socket);
    this.socket.onIncommingMessage.Subscribe(this.OnMessageTriggered.bind(this));
  }

  public AddCommand(commandInstance: ICommand) {
    this.CommandsHandler.AddCommand(commandInstance);
  }

  private async OnMessageTriggered(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) {
    console.log(rawMsg);
    if (type === MsgType.text) {
      const fullText = Msg_GetTextFromRawMsg(rawMsg);

      ///Check if starts with prefix
      if (!fullText.startsWith(this.config.prefix!)) return;

      const words = fullText.trim().split(' ');
      const command = words[0].slice(this.config.prefix!.length).toLowerCase(); //Removes the prefix;
      const args = words.slice(1);

      //Check if command exists
      if (!this.CommandsHandler.Exists(command)) return;

      //Check if it is registered in bot, an admin?, a member? or neither of them?
      const phoneNumber = Phone_GetPhoneNumberFromRawmsg(rawMsg)!.fullRawCleanedNumber;
      const foundMemberInfo = await Members_GetMemberInfoFromPhone(phoneNumber);
      let roleMember: HelperRoleName;
      if (foundMemberInfo === null) roleMember = "Cualquiera";
      else {
        if (foundMemberInfo.role === "AD") roleMember = "Administrador";
        else roleMember = "Miembro";
      }
      if (!this.CommandsHandler.HasPermisionToExecute(command, roleMember)) {
        this.Send.Text(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }
      const userId = rawMsg.participant || chatId || "There's no participant, so strage...";
      this.CommandsHandler.Execute(command, this, { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userId })
    }
  }


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