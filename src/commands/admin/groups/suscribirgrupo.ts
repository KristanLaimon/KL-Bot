import Bot from "../../../bot";
import { SpecificChat } from "../../../bot/SpecificChat";
import { BotCommandArgs } from "../../../types/bot";
import {
  CommandAccessibleRoles,
  CommandHelpInfo,
  CommandScopeType,
  ICommand,
  SenderType
} from "../../../types/commands";
import { Msg_DefaultHandleError } from "../../../utils/rawmsgs";
import SecretAdminPassword from "../../../../db/secretAdminPassword";
import { Members_GetMemberInfoFromWhatsappId } from "../../../utils/members";
import { Phone_GetFullPhoneInfoFromRawMsg } from "../../../utils/phonenumbers";
import moment from "moment";
import GlobalCache from "../../../bot/cache/GlobalCache";
import Kldb from "../../../utils/kldb";
import SpecificDialog from "../../../bot/SpecificDialog";
import { KlRegisteredWhatsappGroupType } from "../../../types/db";


export default class SubscribeGroupCommand implements ICommand {
  commandName: string = "suscribirgrupo";
  description: string = "Registra el grupo (chat) actual para que el bot pueda interactuar con este chat.";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  scopes: CommandScopeType = "UnregisteredGroup";
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
    const dialog = new SpecificDialog(bot, args);

    if (args.senderType === SenderType.Individual) {
      await groupChat.SendText("No tiene sentido usar este comando en un chat privado, intentalo en un grupo...", true, { quoted: args.originalMsg});
      return;
    }

    //1. Ask for group type
    dialog.AddStep<void, KlRegisteredWhatsappGroupType>("Selecciona cómo quieres registrar este grupo:", async (chat) => {
      const groupTypes = await Kldb.registedWhatsappGroupType.findMany();
      return await chat.DialogWaitAnOptionFromListObj(
        groupTypes,
        (_, i) => (i + 1).toString(),
        "Lista de tipos de grupos disponibles:",
        "Ese tipo de grupo no existe, selecciona el número de la lista, e.g: '1' para el primer. Prueba de nuevo:",
        (info, index) => `${index + 1}. ${info.name}`,
        30
      );
    });

    //2. Ask for password and checking if it already exists, do the rest
    dialog.AddStep<KlRegisteredWhatsappGroupType, void>("Revisa el chat privado conmigo, te he mandado mensaje para continuar el proceso allí:", async (originalChat, selectedGroupType, cancelDialog) => {
      const chatUser = new SpecificChat(bot, args, args.userIdOrChatUserId);
      const groupData = await bot.Receive.GetGroupMetadata(args.chatId);

      await chatUser.SendText(`Veo que has iniciado el proceso para registrar el grupo ${groupData.subject} en el bot como ${selectedGroupType.name}`);
      await chatUser.SendText("Para continuar con el proceso, introduce la contraseña de superadministrador");

      const hasEnteredPassword = await chatUser.AskForSpecificText(new RegExp(`${SecretAdminPassword}`), "Esa no es la contraseña de superadministrador, vuelve a intentarlo: (30 Segundos)", 30);

      const foundGroupInfo = await Kldb.registeredWhatsappGroups.findFirst({
        where: { chat_id: args.chatId },
        include: { GroupType: true}
      });

      if(foundGroupInfo){
        await chatUser.SendText(`Este grupo ya está registrado como tipo ${foundGroupInfo.GroupType.name}. Ocuparías desuscribirlo con !desuscribirgrupo o similar primero para cambiar el tipo de grupo.`);
        await chatUser.SendText("Terminando proceso...");
        await originalChat.SendReactionToOriginalMsg("❌");
        cancelDialog();
      }else{
        const created = await Kldb.registeredWhatsappGroups.create({
          data: {
            chat_id: args.chatId,
            group_type: selectedGroupType.id,
            group_name: groupData.subject,
            date_registered: Date.now()
          }
        });

        if(created){
          await chatUser.SendText(`Grupo registrado con éxito!`);
          await originalChat.SendText(`Grupo registrado con éxito (De tipo ${selectedGroupType.name})`);
          await originalChat.SendReactionToOriginalMsg("✅");
          cancelDialog();
        }else{
          await chatUser.SendText("Hubo un error raro registrando el grupo... fin")
          cancelDialog();
        }
      }
    });


    try {
      await dialog.StartConversation();
      await GlobalCache.UpdateCache();
      await groupChat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}


   //
    //   const alreadyExists = GlobalCache.SemiAuto_AllowedWhatsappGroups.find(allowedGroupObj => allowedGroupObj.chat_id === args.chatId);
    //   if (alreadyExists) {
    //     await groupChat.SendText("Este grupo ya está registrado en este bot, no es necesario volver a hacerlo", true, { quoted: args.originalMsg});
    //     return;
    //   }
    //   const info = await bot.Receive.GetGroupMetadata(args.chatId)!;
    //
    //   await groupChat.SendText("Checa el chat privado para continuar con esta operación",  true, { quoted: args.originalMsg});
    //
    //   await chatUser.SendText(`Estás intentando registrar el grupo ${info?.subject} en este bot, ¿Verdad?`);
    //   await chatUser.SendText("Introduce la contraseña de superadministrador para continuar con el proceso....")
    //   const enteredPassword = await chatUser.AskText(30);
    //   if (enteredPassword != SecretAdminPassword) {
    //     await chatUser.SendText("Contraseña incorrecta, fin del proceso");
    //     return;
    //   }
    //   await chatUser.SendText(`Se está guardando el chat dentro del bot... checa el grupo en cuestión para verificar`);
    //   await Kldb.registeredWhatsappGroups.create({
    //     data: {
    //       chat_id: args.chatId,
    //       date_registered: Date.now(),
    //       group_name: info?.subject || "Default Whatsapp Group Name"
    //     }
    //   })
    //   await chatUser.SendText(`Se ha guardado exitosamente el grupo ${info && info.subject}`);
    //
    //   const adminInfo = await Members_GetMemberInfoFromWhatsappId(Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg).whatsappId);
    //
    //   await groupChat.SendText(`
    //   Se ha guardado exitosamente la información de este chat gracias a ${adminInfo?.username || "un admin"}:
    //   Nombre: ${info?.subject}
    //   Fecha de registro: ${moment().format('dddd, MMMM Do YYYY, h:mm A')}
    //   /// 🦊 fin 🦊 ///
    // `);
