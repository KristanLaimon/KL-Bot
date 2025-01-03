import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { CommandAccessibleRoles, ICommand, MsgType, CommandScopeType, SenderType, CommandHelpInfo } from '../../../types/commands';
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../../utils/rawmsgs";
import SecretAdminPassword from '../../../../db/secretAdminPassword';
import { Members_GetMemberInfoFromWhatsappId } from '../../../utils/members';
import { Phone_GetFullPhoneInfoFromRawMsg } from '../../../utils/phonenumbers';
import moment from 'moment';
import GlobalCache from '../../../bot/cache/GlobalCache';
import Kldb from "../../../utils/kldb";


export default class SubscribeGroupCommand implements ICommand {
  commandName: string = "suscribirgrupo";
  description: string = "Registra el grupo (chat) actual para que el bot pueda interactuar con este chat.";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  maxScope: CommandScopeType = "External";
  helpMessage?: CommandHelpInfo = {
    structure: "suscribirgrupo",
    examples: [
      { text: "suscribirgrupo", isOk: true },
      { text: "suscribirgrupo someotherargument", isOk: false }
    ],
    notes: "Este comando registra el grupo actual para que el bot pueda interactuar con él. Necesitarás la contraseña de superadministrador para completar el proceso."
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const groupChat = new SpecificChat(bot, args);
    const chatUser = new SpecificChat(bot, args, args.userIdOrChatUserId);

    if (args.senderType === SenderType.Individual) {
      await groupChat.SendText("No tiene sentido usar este comando en un chat privado, intentalo en un grupo...", true, { quoted: args.originalMsg});
      return;
    }

    const alreadyExists = GlobalCache.SemiAuto_AllowedWhatsappGroups.find(allowedGroupObj => allowedGroupObj.chat_id === args.chatId);
    if (alreadyExists) {
      await groupChat.SendText("Este grupo ya está registrado en este bot, no es necesario volver a hacerlo", true, { quoted: args.originalMsg});
      return;
    }

    try {
      const info = await bot.Receive.GetGroupMetadata(args.chatId)!;

      await groupChat.SendText("Checa el chat privado para continuar con esta operación",  true, { quoted: args.originalMsg});

      await chatUser.SendText(`Estás intentando registrar el grupo ${info?.subject} en este bot, ¿Verdad?`);
      await chatUser.SendText("Introduce la contraseña de superadministrador para continuar con el proceso....")
      const enteredPassword = await chatUser.AskText(30);
      if (enteredPassword != SecretAdminPassword) {
        await chatUser.SendText("Contraseña incorrecta, fin del proceso");
        return;
      }
      await chatUser.SendText(`Se está guardando el chat dentro del bot... checa el grupo en cuestión para verificar`);
      await Kldb.registeredWhatsappGroups.create({
        data: {
          chat_id: args.chatId,
          date_registered: Date.now(),
          group_name: info?.subject || "Default Whatsapp Group Name"
        }
      })
      await chatUser.SendText(`Se ha guardado exitosamente el grupo ${info && info.subject}`);

      const adminInfo = await Members_GetMemberInfoFromWhatsappId(Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg).whatsappId);

      await groupChat.SendText(`
      Se ha guardado exitosamente la información de este chat gracias a ${adminInfo?.username || "un admin"}:
      Nombre: ${info?.subject}
      Fecha de registro: ${moment().format('dddd, MMMM Do YYYY, h:mm A')}
      /// 🦊 fin 🦊 ///
    `);
      await GlobalCache.UpdateCache();
      await groupChat.SendReactionToOriginalMsg("✅");

    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}