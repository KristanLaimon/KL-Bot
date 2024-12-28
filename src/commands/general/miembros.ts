import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import Kldb from '../../utils/db';

export default class VerMiembrosCommand implements ICommand {
  commandName: string = "miembros";
  description: string = "Checa todos los miembros actuales del clan";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  maxScope: CommandScopeType = "Group"
  helpMessage?: CommandHelpInfo = {
    structure: "miembros",
    examples: [{ text: "miembros", isOk: true }, { text: "miembros someotherargument", isOk: false }],
    notes: "Checa todos los miembros actuales del clan"
  }
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const allMembers = await Kldb.player.findMany({ include: { Rank: true, Role: true } });
      await chat.SendTxt("========= Miembros Registrados ========");
      const txt = allMembers
        .map((info, i) =>
          `${i + 1}. *${info.Role.name}* ${info.Rank.id} | ${info.username}`
        ).join("\n");
      await chat.SendTxt(txt);
    } catch (e) {
      await chat.SendTxt("Ocurrió un error con la base de datos por alguna razón...");
    }
  }
}