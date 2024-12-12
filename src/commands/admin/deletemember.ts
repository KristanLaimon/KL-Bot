import Kldb from '../../utils/db';
import Bot from '../../bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';


export default class DeleteAdmin implements ICommand {
  commandName: string = 'deletemember';
  description: string = "DeleteAdmin"
  roleCommand: CommandAccessibleRoles = "Secreto";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    await bot.SendTxtToChatId(args.chatId, "Eliminado de un miembro");
    const allMembers = await Kldb.player.findMany({ include: { Role: true } });
    const allMembersText = allMembers.map(memberObj => `🦁 ${memberObj.Role.name}: ${memberObj.username}`).join("\n");

    await bot.SendTxtToChatId(args.chatId, `Los miembros actuales son: \n${allMembersText}`);

    try {
      let possibleMemberName: string;
      do {
        await bot.SendTxtToChatId(args.chatId, "¿Cuál es el nombre del miembro que deseas eliminar?");
        possibleMemberName = await bot.WaitNextTxtMsgFromUserId(args.chatId, args.userId)
        if (!allMembers.find(adObj => adObj.username === possibleMemberName)) {
          possibleMemberName = "";
          await bot.SendTxtToChatId(args.chatId, "No existe ese administrador, intenta de nuevo...");
        } else await bot.SendTxtToChatId(args.chatId, `Escogido correctamente al usuario ${possibleMemberName}`);
      } while (possibleMemberName !== "");

      await bot.SendTxtToChatId(args.chatId, "Borrando administrador...");
      const deleted = await Kldb.player.delete({ where: { username: possibleMemberName } });
      await bot.SendTxtToChatId(args.chatId, `Se ha borrado correctamente los datos del usuario: ${JSON.stringify(deleted)}`)
      await bot.SendTxtToChatId(args.chatId, "========= Finalizado =========");
    } catch (error) {
      if (utils.Msg.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser) {
          await bot.SendTxtToChatId(args.chatId, "Se ha cancelado el borrado del miembro");
        }
        else if (!error.wasAbortedByUser) {
          await bot.SendTxtToChatId(args.chatId, "Te has tardado mucho en contestar...")
        }
      } else {
        await bot.SendTxtToChatId(args.chatId, `Ha ocurrido un error extraño... \n${JSON.stringify(error)}`)
      }
    }
  }
}