import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import Kldb from "../../utils/kldb";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";

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
      let txt = allMembers
        .map((info, i) =>
          `${i + 1}. *${info.Role.name}* ${info.Rank.id} | ${info.username}`
        )//.join("\n");
      txt = [beginning, ...txt];
      await chat.SendTxt(txt.join("\n"), true, { quoted: args.originalMsg});
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}