import fs from "fs";
import { GroupMetadata, WAMessage } from '@whiskeysockets/baileys';
import CommandsHandler from './bot/Commands';
import KlLogger, { KlCommandLogger, Log_LogRawMsg } from './bot/logger';
import { WhatsMsgReceiver } from './bot/WhatsMsgReceiver';
import { WhatsMsgSender } from './bot/WhatsMsgSender';
import WhatsSocket from './bot/WhatsSocket';
import { BotCommandArgs } from './types/bot';
import { HelperRoleName, ICommand, MsgType, SenderType } from './types/commands';
import { Members_GetMemberInfoFromPhone } from './utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from './utils/phonenumbers';
import { Msg_GetTextFromRawMsg } from './utils/rawmsgs';
import GlobalCache from './bot/cache/GlobalCache';

type BotArgs = {
  prefix?: string;
  coolDownSecondsTime?: number;
  maxQueueMsgs?: number; /** Max quantity of msgs to handle at the same time */
};

export default class Bot {
  /**
   * This command will be executed when someone talk to this bot
   * without any existing (prefix)command in privatechat. Doesn't apply
   * on groups, that woulf be annoying
   */
  private defaultCommand: ICommand | null;
  private socket: WhatsSocket;

  public config: BotArgs;
  public Send: WhatsMsgSender;
  public Receive: WhatsMsgReceiver;
  public CommandsHandler: CommandsHandler;

  constructor(args: BotArgs | undefined) {
    this.config = {
      coolDownSecondsTime: 1000 * (args?.coolDownSecondsTime || 1),
      maxQueueMsgs: args?.maxQueueMsgs || 10,
      prefix: args?.prefix || "!",
    };
    this.defaultCommand == null;
    this.CommandsHandler = new CommandsHandler();
    this.OnMessageTriggered = this.OnMessageTriggered.bind(this);
    this.StartBot = this.StartBot.bind(this);
  }

  public async StartBot() {
    this.socket = new WhatsSocket();
    this.Send = new WhatsMsgSender(this.socket, 5, 1000);
    this.Receive = new WhatsMsgReceiver(this.socket);

    this.socket.onReconnect.Subscribe(async () => await this.StartBot());
    this.OnMessageTriggered = this.OnMessageTriggered.bind(this);
    this.socket.onIncommingMessage.Subscribe(this.OnMessageTriggered);
    this.OnEnteringGroup = this.OnEnteringGroup.bind(this);
    this.socket.onEnteringGroup.Subscribe(this.OnEnteringGroup);

    await GlobalCache.UpdateCache();
    this.socket.Init();
  }

  public AddCommand(commandInstance: ICommand) {
    this.CommandsHandler.AddCommand(commandInstance);
    this.CommandsHandler.Commands.sort((a, b) => a[0].localeCompare(b[0]));
  }

  get Commands() {
    return this.CommandsHandler.Commands;
  }

  private async OnEnteringGroup(groupInfo: GroupMetadata) {
    try {
      const defaultWelcomeMsgGroupPath = "resources/default_welcome/group/msg.txt"
      const defaultWelcomeCoverGroupPath = "resources/default_welcome/group/cover.jpg"
      // const defaultWelcomeMsgUserPath = "resources/default_welcome/user/msg.txt"
      // const defaultWelcomeCoverUserPath = "resources/default_welcome/user/cover.jpg"
      const text = fs.readFileSync(defaultWelcomeMsgGroupPath).toString();
      this.Send.Img(groupInfo.id, defaultWelcomeCoverGroupPath, text);

    } catch (e) {
      KlLogger.error(`There was an error loading default welcome: ${JSON.stringify(e, null, 0)}`)
    }
  }

  private async OnMessageTriggered(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) {
    console.log(rawMsg);
    Log_LogRawMsg(rawMsg);

    let msgComesFromRegisteredGroup = true;
    if (senderType === SenderType.Group) {
      const foundChatGroup = GlobalCache.SemiAuto_AllowedWhatsappGroups.find(groupInfo => groupInfo.chat_id === chatId);
      if (!foundChatGroup) msgComesFromRegisteredGroup = false
    }
    // If is individual chat doesn't matter, you want to have all bot capabilities when talking to him directly;


    if (type === MsgType.text) {
      const fullText = Msg_GetTextFromRawMsg(rawMsg);

      ///Check if starts with prefix
      if (!fullText.startsWith(this.config.prefix!)) return;

      if (fullText.length > 1500) {
        this.Send.Text(chatId, 'El mensaje es demasiado largo, (¿Cómo por qué mandarías algo así?) ...');
        return;
      }

      const userId = rawMsg.key.participant || chatId || "There's no participant, so strage...";
      if (GlobalCache.Auto_IdUsersUsingCommands.includes(userId)) return;

      //Parse the command
      const words = fullText.trim().split(' ');
      const commandNameText = words[0].slice(this.config.prefix!.length).toLowerCase(); //Removes the prefix;
      const args = words.slice(1);

      //Check if command exists
      if (!this.CommandsHandler.Exists(commandNameText)) return;
      //TODO: Make a try to guess what the user tried really to type and give feedback

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
        if (!this.CommandsHandler.HasCorrectScope(commandNameText, "Group")) {
          if (senderType === SenderType.Group)
            this.Send.Text(chatId, 'No puedes usar un comando externo en un grupo registrado...');
          if (senderType === SenderType.Individual)
            this.Send.Text(chatId, 'No puedes usar un comando para chats no registrados en un chat individual...')
          return;
        }
      } else {
        if ((!this.CommandsHandler.HasCorrectScope(commandNameText, "External"))) {
          //if enters here it means it could be a group or a private chat with someone
          if (senderType === SenderType.Group)
            this.Send.Text(chatId, 'No puedes usar ese comando en un grupo no registrado por el bot...')
          if (senderType === SenderType.Individual)
            this.Send.Text(chatId, 'No puedes usar ese comando de grupo en un chat individual (??)...');
          return;
        }
      }

      //Check permissions
      if (!this.CommandsHandler.HasPermissionToExecute(commandNameText, actualRoleSender)) {
        this.Send.Text(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }


      const commandArgs: BotCommandArgs = { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userIdOrChatUserId: userId }

      GlobalCache.Auto_IdUsersUsingCommands.push(userId);
      this.CommandsHandler.Execute(commandNameText, this, commandArgs).then(() => GlobalCache.RemoveIdUserUsingCommand(userId));

      KlCommandLogger.info({
        event: 'CommandExecution',
        command: commandNameText,
        user: rawMsg.pushName,
        role: foundMemberInfo?.Role.name || 'Unregistered',
        phone: phoneNumber,
        chatId,
        chatType: senderType === SenderType.Group ? 'Group' : 'Individual',
        args,
        status: 'success',
      });
    }
  }
}

