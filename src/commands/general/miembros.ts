import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import Kldb from "../../utils/kldb";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import { Phone_GetFullPhoneInfoFromId, Phone_GetFullPhoneInfoFromRawMsg } from "../../utils/phonenumbers";

export default class VerMiembrosCommand implements ICommand {
  commandName: string = "miembros";
  description: string = "Checa todos los miembros actuales del clan";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  maxScope: CommandScopeType = "Group"
  helpMessage?: CommandHelpInfo = {
    structure: "miembros",
    examples: [{ text: "miembros", isOk: true }, { text: "miembros some_other_argument", isOk: false }],
    notes: "Checa todos los miembros actuales del clan"
  }
  async onMsgReceived(bot: Bot, args: BotCommandArgs):Promise<void> {
    const chat = new SpecificChat(bot, args)
    try {
      const allMembers = await Kldb.player.findMany({ include: { Rank: true, Role: true } });
      const beginning = "========= Miembros Registrados ========";
      const mentionsIds:string[] = [];
      let txt = allMembers
        .map((info, i) =>{
            const phoneInfo = Phone_GetFullPhoneInfoFromId(info.whatsapp_id);
            mentionsIds.push(phoneInfo.whatsappId);
            return `${i + 1}. *${info.Role.name}* ${info.Rank.id} | ${info.username} | ${phoneInfo.mentionFormatted}`
        }
        )//.join("\n");
      txt = [beginning, ...txt];
      await chat.SendText(txt.join("\n"), true, { quoted: args.originalMsg}, mentionsIds);
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}