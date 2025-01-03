import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandScopeType, ICommand } from "../../types/commands";
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../utils/rawmsgs";
import SpecificDialog from "../../bot/SpecificDialog";
import { KlTournament } from "../../types/db";
import { Phone_GetFullPhoneInfoFromRawMsg } from "../../utils/phonenumbers";

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: CommandScopeType = "Group"

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      // const phoneInfo = Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)
      // await chat.SendText(`${phoneInfo.mentionFormatted} eres tú? 💖`, true, { quoted: args.originalMsg }, [phoneInfo.whatsappId]);
      // await chat.SendText(JSON.stringify(Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)));
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);

    }
  }
}