import { HelperRoleName, ICommand, MsgType, CommandScopeType } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { FileSystem_TryToDownloadMedia } from '../../utils/filesystem';
import { Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';

export default class ReceiveImgCommand implements ICommand {
  commandName: string = "img";
  description: string = "Stores imgs test";
  minimumRequiredPrivileges: HelperRoleName = "Administrador"
  maxScope: CommandScopeType = "Group"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    await bot.Send.Text(args.chatId, "Envia una imagen y la guardaré en mis archivos...", true, { quoted: args.originalMsg});
    try {
      const message = await bot.Receive.WaitNextRawMsgFromId(args.chatId, args.userIdOrChatUserId, MsgType.image, 30);

      if (await FileSystem_TryToDownloadMedia(message, `${message.pushName}-${Date.now()}`, "jpg", "db/players")){
        await bot.Send.Text(args.chatId, `Imagen guardada exitosamente!`);
        await bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "✅");
      }
      else{
        await bot.Send.Text(args.chatId, `Error al guardar la imagen`);
        await bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "❌");
      }
    } catch (error) {
      if (Msg_IsBotWaitMessageError(error)) {
        await bot.Send.Text(args.chatId, "Nunca mandaste la imagen...");
      }
    }
  }
}
