import { HelperRoleName } from '../../../drizzle/helper_types';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot_utils';
import { CommandArgs, ICommand, MsgType } from '../../types/bot_types';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import path from "path";
import fs from "fs";

export default class ReceiveImgCommand implements ICommand {
  commandName: string = "img";
  description: string = "Stores imgs test";
  roleCommand: HelperRoleName = "Administrador"
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    await bot.SendText(args.chatId, "Envia una imagen y la guardaré en mis archivos...");

    try {
      const imgMsg = await bot.WaitMessageFrom(args.chatId, args.userId, MsgType.image, 100000);

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