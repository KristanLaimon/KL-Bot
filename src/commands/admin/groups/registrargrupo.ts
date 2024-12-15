import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { CommandAccessibleRoles, ICommand, MsgType, ScopeType, SenderType } from '../../../types/commands';
import Kldb from '../../../utils/db';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError } from '../../../utils/rawmsgs';
import SecretAdminPassword from '../../../../db/secretAdminPassword';
import { Members_GetMemberInfoFromPhone } from '../../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../../utils/phonenumbers';
import moment from 'moment';


export default class RegistrarGrupoCommand implements ICommand {
  commandName: string = "registrargrupo";
  description: string = "Registra el grupo actual como uno de miembros (o el principal) o como un grupo de admins, para que el bot pueda tomarlos en cuenta";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  maxScope: ScopeType = "External";

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const groupChat = new SpecificChat(bot, args);
    const chatUser = new SpecificChat(bot, args, args.userIdOrChatUserId);

    if (args.senderType === SenderType.Individual) {
      await groupChat.SendTxt("No tiene sentido usar este comando en un chat privado, intentalo en un grupo...");
      return;
    }

    try {
      const info = await bot.Receive.GetGroupMetadata(args.chatId)!;

      await groupChat.SendTxt("Checa el chat privado para continuar con esta operación");

      await chatUser.SendTxt(`Estás intentando registrar el grupo ${info?.subject} en este bot, ¿Verdad?`);
      await chatUser.SendTxt("Introduce la contraseña de superadministrador para continuar con el proceso....")
      const enteredPassword = await chatUser.WaitNextTxtMsgFromSender(30);
      if (enteredPassword != SecretAdminPassword) {
        await chatUser.SendTxt("Contraseña incorrecta, fin del proceso");
        return;
      }
      await chatUser.SendTxt(`Se está guardando el chat dentro del bot... checa el grupo en cuestión para verificar`);
      await Kldb.registeredWhatsappGroups.create({
        data: {
          chat_id: args.chatId,
          date_registered: Date.now(),
          group_name: info?.subject || "Default Whatsapp Group Name"
        }
      })
      await chatUser.SendTxt(`Se ha guardado exitosamente el grupo ${info && info.subject}`);

      const adminInfo = await Members_GetMemberInfoFromPhone(Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg).number);

      await groupChat.SendTxt(`
      Se ha guardado exitosamente la información de este chat gracias a ${adminInfo?.username || "un admin"}:
      Nombre: ${info?.subject}
      Fecha de registro: ${moment().format('dddd, MMMM Do YYYY, h:mm A')}
      /// 🦊 fin 🦊 ///
    `);
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (e.wasAbortedByUser) await groupChat.SendTxt("Se ha cancelado la operación");
        else await groupChat.SendTxt("Te has tardado mucho en contestar...");
      }
      else {
        await groupChat.SendTxt("Ha ocurrido un error extraño... toma una captura de esto y mandalo al creador del bot por favor para arreglarlo");
        await groupChat.SendTxt("Error en cuestión:")
        await groupChat.SendTxt(JSON.stringify(e));
      }
    }
  }
}