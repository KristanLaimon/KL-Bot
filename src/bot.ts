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

    let msgComesFromRegisteredGroup = true;
    if (senderType === SenderType.Group) {
      const foundChatGroup = KldbCacheAllowedWhatsappGroups.find(groupInfo => groupInfo.chat_id === chatId);
      if (!foundChatGroup) msgComesFromRegisteredGroup = false
    }
    if (senderType === SenderType.Individual) msgComesFromRegisteredGroup = false;

    if (type === MsgType.text) {
      const fullText = Msg_GetTextFromRawMsg(rawMsg);
      ///Check if starts with prefix
      if (!fullText.startsWith(this.config.prefix!)) return

      //Parse the command
      const words = fullText.trim().split(' ');
      const commandNameText = words[0].slice(this.config.prefix!.length).toLowerCase(); //Removes the prefix;
      const args = words.slice(1);

      //Check if command exists
      if (!this.CommandsHandler.Exists(commandNameText)) return;

      //Check sender phone number
      const phoneNumber = Phone_GetFullPhoneInfoFromRawmsg(rawMsg)!.number;

      //Check sender premissions
      const foundMemberInfo = await Members_GetMemberInfoFromPhone(phoneNumber);
      let actualRoleSender: HelperRoleName;
      if (foundMemberInfo === null) actualRoleSender = "Cualquiera";
      else {
        if (foundMemberInfo.role === "AD") actualRoleSender = "Administrador";
        else actualRoleSender = "Miembro";
      }

      //Check Scope
      if (msgComesFromRegisteredGroup) {
        //If enters here it means it MUST be a group ofc
        if (!this.CommandsHandler.HasCorrectScope(commandNameText, "Group")) {
          this.Send.Text(chatId, 'No puedes usar un comando externo en un grupo registrado...');
          return;
        }
      } else {
        if ((!this.CommandsHandler.HasCorrectScope(commandNameText, "External"))) {
          //if enters here it means it could be a group or a private chat with someone
          if (senderType === SenderType.Group)
            this.Send.Text(chatId, 'No puedes usar un comando de grupo en este grupo no registrado por el bot...')
          if (senderType === SenderType.Individual)
            this.Send.Text(chatId, 'No puedes usar un comando de grupo en un chat individual...');
          return;
        }
      }

      //Check permissions
      if (!this.CommandsHandler.HasPermissionToExecute(commandNameText, actualRoleSender)) {
        this.Send.Text(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }

      const userId = rawMsg.key.participant || chatId || "There's no participant, so strage...";
      const commandArgs: BotCommandArgs = { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userIdOrChatUserId: userId }
      this.CommandsHandler.Execute(commandNameText, this, commandArgs);
    }
  }
}

