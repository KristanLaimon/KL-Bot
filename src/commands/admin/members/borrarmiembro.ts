import Bot from '../../../bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../../types/commands';
import { BotCommandArgs } from '../../../types/bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../../utils/rawmsgs";
import Kldb from "../../../utils/kldb";


export default class DeleteMemberCommand implements ICommand {
  commandName: string = 'borrarmiembro';
  description: string = "Elimina a un miembro existente en el clan"
  minimumRequiredPrivileges: CommandAccessibleRoles = "Secreto";
  maxScope: CommandScopeType = "Group";
  helpMessage: CommandHelpInfo = {
    structure: "borrarmiembro",
    examples: [
      { text: "borrarmiembro", isOk: true },
      { text: "borrarmiembro algunargumentoextra", isOk: false }
    ],
    notes: "Este comando elimina un miembro existente del clan. Asegúrate de tener privilegios secretos para usar este comando."
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    await chat.SendText("Eliminado de un miembro",  true, { quoted: args.originalMsg});
    try {
      const allMembers = await Kldb.player.findMany({ include: { Role: true, Rank: true } });
      let selectedMember = await chat.DialogWaitAnOptionFromListObj(
        allMembers,
        (memberObj) => memberObj.username,
        "Selecciona el username del miembro del que se desea eliminar:",
        "Ese username no le pertenece a nadie, intenta de nuevo:",
        (memberObj, index) => `${index + 1}. *${memberObj.Role.name}* ${memberObj.Rank.id} | ${memberObj.username}`,
        60 //timeout in seconds limit to respond
      );
      const deletedPlayer = await Kldb.player.delete({ where: { username: selectedMember.username } });

      if (deletedPlayer) await chat.SendText(`Se ha borrado correctamente los datos del usuario: *${deletedPlayer.username}*`);
      else await chat.SendText(`Ha ocurrido un error raro, pero no ha sido borrado`);

      await chat.SendText("================ Finalizado ===================")
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}