import Kldb from '../../../utils/db';
import Bot from '../../../bot';
import { CommandAccessibleRoles, ICommand, ScopeType } from '../../../types/commands';
import { BotCommandArgs } from '../../../types/bot';
import { AllUtilsType } from '../../../utils/index_utils';
import { SpecificChat } from '../../../bot/SpecificChat';
import { Msg_IsBotWaitMessageError } from '../../../utils/rawmsgs';


export default class DeleteAdmin implements ICommand {
  commandName: string = 'deletemembersssss';
  description: string = "Elimina a un miembro existente en el clan"
  minimumRequiredPrivileges: CommandAccessibleRoles = "Secreto";
  maxScope: ScopeType = "Group";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    await chat.SendTxt("Eliminado de un miembro");
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

      if (deletedPlayer) await chat.SendTxt(`Se ha borrado correctamente los datos del usuario: *${deletedPlayer.username}*`);
      else await chat.SendTxt(`Ha ocurrido un error raro, pero no ha sido borrado`);

      await chat.SendTxt("=================== Finalizado ===============")
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (e.wasAbortedByUser) await chat.SendTxt("Se ha cancelado el borrado del miembro");
        else await chat.SendTxt("Te has tardado mucho en contestar...")
      } else
        await chat.SendTxt(`Ha ocurrido un error extraño... \n${JSON.stringify(e)}`)
    }
  }
}