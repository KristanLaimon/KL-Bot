import { HelperRoleName, ICommand, MsgType, ScopeType } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';
import { Db_TryToDownloadMedia } from '../../utils/filesystem';
import { Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';

export default class ReceiveImgCommand implements ICommand {
  commandName: string = "img";
  description: string = "Stores imgs test";
  minimumRequiredPrivileges: HelperRoleName = "Administrador"
  maxScope: ScopeType = "Group"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    await bot.Send.Text(args.chatId, "Envia una imagen y la guardaré en mis archivos...");

    try {
      const message = await bot.Receive.WaitNextRawMsgFromId(args.chatId, args.userIdOrChatUserId, MsgType.image, 30);

      if (await Db_TryToDownloadMedia(message, `${message.pushName}-${Date.now()}`, "jpg", "db/players"))
        await bot.Send.Text(args.chatId, `Imagen guardada exitosamente!`);
      else
        await bot.Send.Text(args.chatId, `Error al guardar la imagen`);

    } catch (error) {
      if (Msg_IsBotWaitMessageError(error)) {
        await bot.Send.Text(args.chatId, "Nunca mandaste la imagen...");
      }
    }
  }
}
