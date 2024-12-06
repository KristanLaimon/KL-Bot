import { HelperRoleName } from '../../types/helper_types';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot';
import { BotCommandArgs, ICommand, MsgType } from '../../types/bot_types';
import { downloadMediaMessage, isJidBroadcast, WAMessage } from '@whiskeysockets/baileys';
import path from "path";
import fs from "fs";

export default class ReceiveImgCommand implements ICommand {
  commandName: string = "img";
  description: string = "Stores imgs test";
  roleCommand: HelperRoleName = "Administrador"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatId, "Envia una imagen y la guardaré en mis archivos...");

    try {
      const imgMsg = await bot.WaitRawMessageFrom(args.chatId, args.userId, MsgType.image, 100000);

      if (await utils.DownloadMedia(imgMsg, `${imgMsg.pushName}-${Date.now()}`, "jpg", "db/players"))
        await bot.SendText(args.chatId, `Imagen guardada exitosamente!`);
      else
        await bot.SendText(args.chatId, `Error al guardar la imagen`);

    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        await bot.SendText(args.chatId, "Nunca mandaste la imagen...");
      }
    }
  }
}
