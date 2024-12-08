import { HelperRoleName, ICommand, MsgType } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';

export default class ReceiveImgCommand implements ICommand {
  commandName: string = "img";
  description: string = "Stores imgs test";
  roleCommand: HelperRoleName = "Administrador"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    await bot.SendText(args.chatId, "Envia una imagen y la guardaré en mis archivos...");

    try {
      const imgMsg = await bot.WaitRawMessageFromId(args.chatId, args.userId, MsgType.image, 100000);

      if (await utils.FileSystem.DownloadMedia(imgMsg, `${imgMsg.pushName}-${Date.now()}`, "jpg", "db/players"))
        await bot.SendText(args.chatId, `Imagen guardada exitosamente!`);
      else
        await bot.SendText(args.chatId, `Error al guardar la imagen`);

    } catch (error) {
      if (utils.Msg.isBotWaitMessageError(error)) {
        await bot.SendText(args.chatId, "Nunca mandaste la imagen...");
      }
    }
  }
}
