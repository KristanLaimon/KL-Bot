import { CommandAccessibleRoles, HelperRankId, HelperRankName, HelperRoleName } from '../../types/helper_types';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot_utils';
import { CommandArgs, ICommand, MsgType } from '../../types/bot_types';
import fs from 'fs'
import Kldb from '../../../main';
import path from 'path';
import { CapitalizeStr } from '../../utils';

export default class AddAdminCommand implements ICommand {
  commandName: string = "addadmin";
  description: string = "Add an admin to the bot.... only the bot owner can do this so far";
  roleCommand: CommandAccessibleRoles = "Administrador";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    const separator = "=======================";
    const SendText = async (msg: string) => await bot.SendText(args.chatId, msg);

    /// 1 of 4: Password
    await bot.SendText(args.chatId, `
        ${separator}
        Add Admin CommandAccessibleRoles
        Añadiendo un nuevo administrador
        ${separator}
        Paso 1 de 5: Para continuar, tienes que brindar la contraseña secreta entre administradores:
      `);
    let password: string;
    try {
      password = await bot.WaitTextMessageFrom(args.chatId, args.userId, 20);
      if (password != fs.readFileSync('db/secretpassword.txt').toString()) {
        await bot.SendText(args.chatId, "Wrong password...");
        return;
      }
    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser) {
          await SendText("Se ha cancelado el agregado del admin");
        } else {
          await SendText("Se ha tardado en recibir la contraseña")
        }
      }
    }

    // 2 of 5: Admin name
    await bot.SendText(args.chatId, "Paso 2 de 5: Brinda el nombre dentro del juego del administrador: ");
    const name = await bot.WaitTextMessageFrom(args.chatId, args.userId);

    // 3 of 5: Admin rank
    await SendText(`
        ${separator}
        Paso 3 de 5: Binda el rango del usuario administrador: 
      `);
    const availablesRanksText = (await Kldb.rank.findMany({ select: { name: true } }))
      .map(name => name.name)
      .reduce((fullStr, rankStr) => fullStr + `⭕ ${rankStr}\n`);
    try {
      await bot.SendText(args.chatId, `
          Elige alguno de los siguientes rangos:
          ${availablesRanksText}
        `);
      let validRank;
      do {
        const rankPrompt = await bot.WaitTextMessageFrom(args.chatId, args.userId, 60);
        validRank = await Kldb.rank.findFirst({ where: { name: CapitalizeStr(rankPrompt) } });

        if (!validRank)
          await SendText("No existe ese rango...")
      } while (!validRank);

      await SendText(`${separator}\nPaso 4 de 5: Brinda una captura/foto de su foto de perfil dentro del Rocket League Sideswipe:`);
      let wasValidImg: boolean = false;
      let imgName: string;
      do {
        imgName = `AD-${name}-${Date.now()}-profile-picture`;
        wasValidImg = await utils.DownloadMedia(
          await bot.WaitMessageFrom(
            args.chatId,
            args.userId,
            MsgType.image, 60),
          imgName,
          ".png",
          "db/players"
        )
        if (!wasValidImg) {
          await bot.SendText(args.chatId, "Invalid image, try again...");
        } else
          SendText("Se ha recibido correctamente la imagen");
      } while (!wasValidImg);

      await SendText(separator)
      await SendText("Paso 5 de 5: Pasame el nombre de usuario en whatsapp del usuario");
      await SendText("Si quieres que se registre tu nombre de usuario escribe:  mio");
      const whatsappNameOrNot = await bot.WaitTextMessageFrom(args.chatId, args.userId, 120);
      if (whatsappNameOrNot == "mio") {
        whatsappNameOrNot == args.originalPromptMsgObj.pushName!
      }

      await SendText("Estoy guardando la información...");
      await Kldb.player.create({
        data: {
          actualRank: (validRank as unknown as { id: HelperRankId }).id,
          phoneNumber: utils.GetPhoneNumber(args.originalPromptMsgObj).fullRawNumber,
          profilePicturePath: imgName,
          role: "AD",
          username: name,
          whatsappNickName: whatsappNameOrNot
        }
      })

      const m: string[] = [];
      m.push("------ Se ha guardado exitosamente los datos siguientes: --------")
      m.push(`Ingame Username: ${name}`)
      m.push(`Role: Administrator | AD`);
      m.push(`Rango: ${validRank!.name}`)
      m.push(`ProfileImage:`);
      m.push(`WhatsappNickName`)
      await bot.SendText(args.chatId, m.join("\n"));
      await bot.SendImg(args.chatId, path.join("db", imgName, ".png"));

      await bot.SendText(args.chatId, "===========Terminado==============");
    } catch (error) {
      if (utils.isBotWaitMessageError(error)) {
        if (error.wasAbortedByUser) {
          await SendText("Se ha cancelado el proceso de creación del administrador");
        }
        else if (!error.wasAbortedByUser) {
          await SendText("Te has tardado demasiado en contestar.. vuelve a intentarlo");
        }
      } else {
        await SendText("Ha ocurrido un error extraño... toma una captura de esto y mandalo al creador del bot por favor para arreglarlo");
        await SendText("Error en cuestión:")
        SendText(error);
      }
    }
  }
}