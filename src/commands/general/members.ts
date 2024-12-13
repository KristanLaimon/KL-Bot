import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import Kldb from '../../utils/db';

export default class SeeMembersCommand implements ICommand {
  commandName: string = "members";
  description: string = "Checa todos los miembros actuales del clan";
  roleCommand: CommandAccessibleRoles = "Cualquiera";
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