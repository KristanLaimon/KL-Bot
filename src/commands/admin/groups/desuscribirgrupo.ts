import Bot from '../../../bot';
import GlobalCache from '../../../bot/cache/GlobalCache';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandAccessibleRoles, CommandScopeType, SenderType, CommandHelpInfo } from '../../../types/commands';
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../../utils/rawmsgs";
import Kldb from "../../../utils/kldb";

export default class UnsubscribeGroupCommand implements ICommand {
  commandName: string = "desuscribirgrupo";
  description: string = "Desuscribe el grupo actual y el bot ya no interactuará con este chat!";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  scopes: CommandScopeType = "General";
  helpMessage?: CommandHelpInfo = {
    structure: "desuscribirgrupo",
    examples: [
      { text: "desuscribirgrupo", isOk: true },
      { text: "desuscribirgrupo algunotroargumento", isOk: false }
    ],
    notes: "Una vez que desuscribas este grupo, ya no podrás acceder a la gran mayoría de las funcionalidades del bot. Tendrás que volver a suscribirlo con permisos de administrador"
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    if (args.senderType !== SenderType.Group) {
      await chat.SendText("No puedes usar este comando en un chat individual", true, { quoted: args.originalMsg });
      await chat.SendReactionToOriginalMsg("❌");
      return;
    }

    if (GlobalCache.SemiAuto_AllowedWhatsappGroups.length === 0) {
      await chat.SendText("No hay grupos que borrar...(?), esto no debería pasar", true, { quoted: args.originalMsg });
      await chat.SendReactionToOriginalMsg("❌")
      return;
    }

    const thisChatInfo = await bot.Receive.GetGroupMetadata(args.chatId);
    await chat.SendText(`
      Estás a punto de desuscribir este grupo ${thisChatInfo?.subject} 
      ¿Estás seguro de que deseas continuar? (s/n)

      Nota: Esto eliminará el grupo de la lista de grupos permitidos para este bot. 
    `, true, { quoted: args.originalMsg });
    try {
      const confirmResponse = await chat.AskText(10);
      if (confirmResponse.includes("s")) {
        await Kldb.registeredWhatsappGroups.delete({
          where: {
            chat_id: args.chatId
          }
        })
        await GlobalCache.UpdateCache();
        await chat.SendText("El grupo ha sido desuscrito exitosamente!, adios 🦊🥲");
      }
      else {
        await chat.SendText("La desuscripción ha sido cancelada");
      }
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}