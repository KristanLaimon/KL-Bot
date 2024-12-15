import fs from "fs";
import WhatsSocket from './bot/WhatsSocket';
import { WhatsMsgSender } from './bot/WhatsMsgSender';
import { WhatsMsgReceiver } from './bot/WhatsMsgReceiver';
import CommandsHandler from './bot/Commands';
import { HelperRoleName, ICommand, MsgType, SenderType } from './types/commands';
import { WAMessage } from '@whiskeysockets/baileys';
import { Msg_GetTextFromRawMsg } from './utils/rawmsgs';
import { Members_GetMemberInfoFromPhone } from './utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from './utils/phonenumbers';
import { BotCommandArgs } from './types/bot';
import Kldb, { KldbCacheAllowedWhatsappGroups, KldbUpdateCacheAsync } from './utils/db';

type BotArgs = {
  prefix?: string;
  coolDownSecondsTime?: number;
  maxQueueMsgs?: number; /** Max quantity of msgs to handle at the same time */
};

export default class Bot {
  private instance: Bot;
  private socket: WhatsSocket;
  private config: BotArgs;

  public Send: WhatsMsgSender;
  public Receive: WhatsMsgReceiver;
  public CommandsHandler: CommandsHandler;

  constructor(args: BotArgs | undefined) {
    this.instance = this;
    this.config = {
      coolDownSecondsTime: 1000 * (args?.coolDownSecondsTime || 1),
      maxQueueMsgs: args?.maxQueueMsgs || 10,
      prefix: args?.prefix || "!",
    };
    this.CommandsHandler = new CommandsHandler();
    this.OnMessageTriggered = this.OnMessageTriggered.bind(this);
    this.StartBot = this.StartBot.bind(this);
  }

  get Commands() {
    return this.CommandsHandler.Commands;
  }

  public async StartBot() {
    this.socket = new WhatsSocket();
    this.Send = new WhatsMsgSender(this.socket, 5, 1000);
    this.Receive = new WhatsMsgReceiver(this.socket);
    this.socket.onIncommingMessage.Subscribe(this.OnMessageTriggered);
    this.socket.onReconnect.Subscribe(async () => await this.StartBot());
    await KldbUpdateCacheAsync();
    this.socket.Init();
  }

  public AddCommand(commandInstance: ICommand) {
    this.CommandsHandler.AddCommand(commandInstance);
  }

  private async OnMessageTriggered(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) {
    console.log(rawMsg);

    let botIsAllowedToRespondThisChat = true;
    if (senderType === SenderType.Group) {
      const foundChatGroup = KldbCacheAllowedWhatsappGroups.find(groupInfo => groupInfo.chat_id === chatId);
      if (!foundChatGroup) botIsAllowedToRespondThisChat = false
    }

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
      const phoneNumber = Phone_GetFullPhoneInfoFromRawmsg(rawMsg)!.number;
      const foundMemberInfo = await Members_GetMemberInfoFromPhone(phoneNumber);
      let roleMember: HelperRoleName;
      if (foundMemberInfo === null) roleMember = "Invitado";
      else {
        if (foundMemberInfo.role === "AD") roleMember = "Administrador";
        else roleMember = "Miembro";
      }
      if (!this.CommandsHandler.HasPermisionToExecute(command, roleMember)) {
        this.Send.Text(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }
      const userId = rawMsg.key.participant || chatId || "There's no participant, so strage...";
      const commandArgs: BotCommandArgs = { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userIdOrChatUserId: userId }

      this.CommandsHandler.Execute(command, this, commandArgs);
    }
  }
}

