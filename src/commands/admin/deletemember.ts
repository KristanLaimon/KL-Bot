import Kldb from '../../../main';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot';
import { CommandArgs, ICommand } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';


export default class DeleteAdmin implements ICommand {
  commandName: string = 'deletemember';
  description: string = "DeleteAdmin"
  roleCommand: CommandAccessibleRoles = "Secreto";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatId, "Eliminado de un miembro");
    const allMembers = await Kldb.player.findMany({ include: { Role: true } });
    const allMembersText = allMembers.map(memberObj => `🦁 ${memberObj.Role.name}: ${memberObj.username}`).join("\n");

    await bot.SendText(args.chatId, `Los miembros actuales son: \n${allMembersText}`);

    try {
      let possibleMemberName: string;
      do {
        await bot.SendText(args.chatId, "¿Cuál es el nombre del miembro que deseas eliminar?");
        possibleMemberName = await bot.WaitTextMessageFrom(args.chatId, args.userId)
        if (!allMembers.find(adObj => adObj.username === possibleMemberName)) {
          possibleMemberName = "";
          await bot.SendText(args.chatId, "No existe ese administrador, intenta de nuevo...");
        } else await bot.SendText(args.chatId, `Escogido correctamente al usuario ${possibleMemberName}`);
      } while (possibleMemberName !== "");

      await bot.SendText(args.chatId, "Borrando administrador...");
      const deleted = await Kldb.player.delete({ where: { username: possibleMemberName } });
      await bot.SendText(args.chatId, `Se ha borrado correctamente los datos del usuario: ${JSON.stringify(deleted)}`)
      await bot.SendText(args.chatId, "========= Finalizado =========");
    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser) {
          await bot.SendText(args.chatId, "Se ha cancelado el borrado del miembro");
        }
        else if (!error.wasAbortedByUser) {
          await bot.SendText(args.chatId, "Te has tardado mucho en contestar...")
        }
      } else {
        await bot.SendText(args.chatId, `Ha ocurrido un error extraño... \n${JSON.stringify(error)}`)
      }
    }
  }
}