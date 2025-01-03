import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandScopeType, ICommand } from "../../types/commands";
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../utils/rawmsgs";
import SpecificDialog from "../../bot/SpecificDialog";
import { KlTournament } from "../../types/db";

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: CommandScopeType = "Group"

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      await chat.SendTxt("Envía cualquier mensaje que quieras:", true, {quoted: args.originalMsg});
      const response = await chat.AskText(60);
      await chat.SendTxt(`Has respondido: ${response}`);
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);

    }
  }
}