import Bot from '../../../bot';
import GlobalCache from '../../../bot/cache/GlobalCache';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandAccessibleRoles, CommandScopeType, SenderType, CommandHelpInfo } from '../../../types/commands';
import { Msg_IsBotWaitMessageError } from '../../../utils/rawmsgs';
import Kldb from "../../../utils/kldb";

export default class UnsubscribeGroupCommand implements ICommand {
  commandName: string = "desuscribirgrupo";
  description: string = "Desuscribe el grupo actual y el bot ya no interactuará con este chat!";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: CommandScopeType = "Group";
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
      await chat.SendTxt("No puedes usar este comando en un chat individual");
      return;
    }

    if (GlobalCache.SemiAuto_AllowedWhatsappGroups.length === 0) {
      await chat.SendTxt("No hay grupos que borrar...(?), esto no debería pasar");
      return;
    }

    const thisChatInfo = await bot.Receive.GetGroupMetadata(args.chatId);
    await chat.SendTxt(`
      Estás a punto de desuscribir este grupo ${thisChatInfo?.subject} 
      ¿Estás seguro de que deseas continuar? (s/n)

      Nota: Esto eliminará el grupo de la lista de grupos permitidos para este bot. 
    `);
    try {
      const confirmResponse = await chat.AskText(10);
      if (confirmResponse.includes("s")) {
        await Kldb.registeredWhatsappGroups.delete({
          where: {
            chat_id: args.chatId
          }
        })
        await GlobalCache.UpdateCache();
        await chat.SendTxt("El grupo ha sido desuscrito exitosamente!, adios 🦊🥲");
      }
      else {
        await chat.SendTxt("La desuscripción ha sido cancelada");
        return;
      }
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (!e.wasAbortedByUser) await chat.SendTxt("Se te acabó el tiempo");
        else await chat.SendTxt("Has cancelado la desuscripción...");
        return;
      }
    }
  }
}