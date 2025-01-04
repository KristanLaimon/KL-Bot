import fs from "fs";
import { GroupMetadata, WAMessage } from "@whiskeysockets/baileys";
import CommandsHandler from "./bot/Commands";
import KlLogger, { KlCommandLogger } from "./bot/logger";
import { WhatsMsgReceiver } from "./bot/WhatsMsgReceiver";
import { WhatsMsgSender } from "./bot/WhatsMsgSender";
import WhatsSocket from "./bot/WhatsSocket";
import { BotCommandArgs } from "./types/bot";
import { CommandScopeType, HelperRoleName, ICommand, MsgType, SenderType } from "./types/commands";
import { Members_GetMemberInfoFromWhatsappId } from "./utils/members";
import { Phone_GetFullPhoneInfoFromRawMsg } from "./utils/phonenumbers";
import { Msg_GetTextFromRawMsg } from "./utils/rawmsgs";
import GlobalCache from "./bot/cache/GlobalCache";
import stringSimilarity from "string-similarity";

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
    await this.socket.Init();
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
      await this.Send.Img(groupInfo.id, defaultWelcomeCoverGroupPath, text);

    } catch (e) {
      KlLogger.error(`There was an error loading default welcome: ${JSON.stringify(e, null, 0)}`)
    }
  }

  private async OnMessageTriggered(chatId: string, rawMsg: WAMessage, type: MsgType, senderType: SenderType) {
    console.log(rawMsg);
    // Log_LogRawMsg(rawMsg); //File its too big, i have enough messages

    let msgComesFromRegisteredGroup = false;
    let foundChatGroup: { chat_id: string; group_name: string; date_registered: bigint; group_type: string; };
    if (senderType === SenderType.Group) {
      foundChatGroup = GlobalCache.SemiAuto_AllowedWhatsappGroups.find(groupInfo => groupInfo.chat_id === chatId);
      if(foundChatGroup) msgComesFromRegisteredGroup = true;
    }
    // If it is an individual chat doesn't matter, you want to have all bot capabilities when talking to him directly;


    if (type === MsgType.text) {
      const fullText = Msg_GetTextFromRawMsg(rawMsg);

      ///Check if starts with prefix
      if (!fullText.startsWith(this.config.prefix!)) return;

      if (fullText.length > 1500) {
         await this.Send.Text(chatId, 'El mensaje es demasiado largo, (¿Cómo por qué mandarías algo así?) ...');
        return;
      }

      const userId = rawMsg.key.participant || chatId || "There's no participant, so strage...";
      if (GlobalCache.Auto_IdUsersUsingCommands.includes(userId)) return;

      //Parse the command
      const words = fullText.trim().split(' ');
      const commandNameText = words[0].slice(this.config.prefix!.length).toLowerCase(); //Removes the prefix;
      const args = words.slice(1);

      //Check if command exists
      if (!this.CommandsHandler.Exists(commandNameText)){
        const validCommands = this.CommandsHandler.Commands.map(command => command[0]);
        const matches = stringSimilarity.findBestMatch(commandNameText, validCommands);
        if(matches.bestMatch.rating > 0.32)
          await this.Send.Text(chatId, `¿No quisiste decir "${this.config.prefix}${matches.bestMatch.target}"?`);
        return;
      }

      //Check sender phone number
      const whatsIdFound = Phone_GetFullPhoneInfoFromRawMsg(rawMsg)!.whatsappId;

      //Check sender premissions
      const foundMemberInfo = await Members_GetMemberInfoFromWhatsappId(whatsIdFound);
      let actualRoleSender: HelperRoleName;
      if (foundMemberInfo === null) actualRoleSender = "Cualquiera";
      else {
        if (foundMemberInfo.role === "AD") actualRoleSender = "Administrador";
        else actualRoleSender = "Miembro";
      }

      //Check Scope
      let callingScope: CommandScopeType;
      if(senderType === SenderType.Group){
        if(msgComesFromRegisteredGroup){
          if (foundChatGroup.group_type === "GN") {
            if (!this.CommandsHandler.HasCorrectScope(commandNameText, "General")) {
              await this.Send.Text(chatId, 'No puedes usar ese comando en un grupo general...');
              return;
            }else{callingScope = "General"}
          }
          if (foundChatGroup.group_type === "TV") {
            if (!this.CommandsHandler.HasCorrectScope(commandNameText, "TournamentValidator")) {
              await this.Send.Text(chatId, 'No puedes usar ese comando en un chat de torneos');
              return;
            }else{callingScope = "TournamentValidator"}
          }
        }else{
          if ((!this.CommandsHandler.HasCorrectScope(commandNameText, "UnregisteredGroup"))) {
            await this.Send.Text(chatId, 'No puedes usar ese comando en un grupo no registrado');
            return;
          }else{callingScope = "UnregisteredGroup"}
        }
      }else if (senderType === SenderType.Individual){
        if (!this.CommandsHandler.HasCorrectScope(commandNameText, "General")) {
          await this.Send.Text(chatId, 'Solo se pueden usar comando de chat generales en chats privados');
          return;
        }else{callingScope = "General"}
      }else{
        callingScope = "UnregisteredGroup";
      }

      //Check permissions
      if (!this.CommandsHandler.HasPermissionToExecute(commandNameText, actualRoleSender)) {
        await this.Send.Text(chatId, "No tienes permiso para ejecutar este comando");
        return;
      }

      const commandArgs: BotCommandArgs = { chatId, commandArgs: args, msgType: type, originalMsg: rawMsg, senderType, userIdOrChatUserId: userId, scopeCalled: callingScope };

      GlobalCache.Auto_IdUsersUsingCommands.push(userId);
      this.CommandsHandler.Execute(commandNameText, this, commandArgs).then(() => GlobalCache.RemoveIdUserUsingCommand(userId));

      KlCommandLogger.info({
        event: 'CommandExecution',
        command: commandNameText,
        user: rawMsg.pushName,
        role: foundMemberInfo?.role || 'Unregistered',
        phone: whatsIdFound,
        chatId,
        chatType: senderType === SenderType.Group ? 'Group' : 'Individual',
        args,
        status: 'success',
      });
    }
  }
}

