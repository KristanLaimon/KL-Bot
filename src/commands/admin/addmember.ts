import { CommandAccessibleRoles, HelperRankId, HelperRankName, HelperRoleName } from '../../types/helper_types';
import Bot, { BotUtilsObj } from '../../bot';
import { CommandArgs, ICommand, MsgType } from '../../types/bot_types';
import fs from 'fs'
import Kldb from '../../../main';
import path, { join } from 'path';
import { CapitalizeStr } from '../../utils';

export default class AddMemberCommand implements ICommand {
  commandName: string = "addmember";
  description: string = "Añade un nuevo miembro al bot";
  roleCommand: CommandAccessibleRoles = "Administrador";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    const separator = "=======================";
    const SendText = async (msg: string) => await bot.SendText(args.chatId, msg);
    let thereWasImgStored: string = "";

    try {
      /// 1 of 4: Password
      await bot.SendText(args.chatId,
        `${separator}
Añadiendo un nuevo administrador
${separator}
Paso 1 de 5: Para continuar, tienes que brindar la contraseña secreta entre administradores:`);

      let password: string;
      password = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);
      if (password != fs.readFileSync('db/secretpassword.txt').toString()) {
        await bot.SendText(args.chatId, "Wrong password...");
        return;
      }

      // 1.1 of 5: Member role
      await SendText(`${separator}\nEnvía el rango del usuario:`);
      let allRolesAvailableText = (await Kldb.role.findMany())
        .map(roleObj => `🐺 ${roleObj.name}`)
        .join('\n');

      let validRole: string | undefined;
      do {
        await SendText(`Elije alguno de los siguientes roles:\n${allRolesAvailableText}`);
        const roleResponse = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);
        validRole = (await Kldb.role.findFirst({ where: { name: CapitalizeStr(roleResponse) } }))?.id;

        if (!validRole) await SendText("No existe ese rol, prueba de nuevo..");
      } while (!validRole);


      // 2 of 5: Admin name
      await bot.SendText(args.chatId, "Paso 2 de 5: Brinda el nombre dentro del juego del miembro: ");
      const name = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);

      // 3 of 5: Member rank
      await SendText(`${separator}\nPaso 3 de 5: Binda el rango del usuario miembro: `);
      const availablesRanksText = (await Kldb.rank.findMany())
        .map((rankObj) => `🦊 ${rankObj.id}: ${rankObj.name}`).join('\n');

      let validRank: string | undefined;
      do {
        await bot.SendText(args.chatId,
          `Elige alguno de los siguientes rangos:
${availablesRanksText}`);

        const rankPrompt = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);
        validRank = (await Kldb.rank.findFirst({ where: { id: rankPrompt.toUpperCase() } }))?.id;

        if (!validRank) await SendText("No existe ese rango...")
      } while (!validRank);

      // 4 of 5: member profile photo sending
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
          "png",
          "db/players"
        )
        if (!wasValidImg) {
          await bot.SendText(args.chatId, "Invalid image, try again...");
        } else
          SendText("Se ha recibido correctamente la imagen");
      } while (!wasValidImg);
      thereWasImgStored = imgName;

      // 5 of 5: Whatsapp name from here
      await SendText(`${separator}\nPaso 5 de 5: Pasame el nombre de usuario en whatsapp del usuario`);
      await SendText("Si quieres que se registre tu nombre de usuario escribe:  mio");
      let whatsappNameOrNot = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);
      if (whatsappNameOrNot.includes("mio")) {
        whatsappNameOrNot = args.originalPromptMsgObj.pushName!
      }
      await SendText(`Se ha seleccionado: ${whatsappNameOrNot}`);


      let numberStr: string;
      let isRightNumber: boolean = false;
      do {
        await SendText(`Paso sorpresa!: Manda su número de whats: (Puedes etiquetarlo con @) o poner 'mio'`);
        numberStr = await bot.WaitTextMessageFrom(args.chatId, args.userId, 250);

        if (numberStr.includes('mio')) {
          const local = utils.GetPhoneNumber(args.originalPromptMsgObj);
          if (local !== null) {
            numberStr = local.fullRawCleanedNumber
            isRightNumber = true;
          } else {
            await SendText("Eso no es un número válido, intenta de nuevo");
          }
        } else if (numberStr.startsWith("@")) {
          const local = utils.GetPhoneNumberFromMention(numberStr);
          if (local !== null) {
            numberStr = local.fullRawCleanedNumber
            isRightNumber = true;
          }
          else {
            await SendText("Eso no es un número válido, intenta de nuevo");
          }
        }
        else if (numberStr.matchAll(/^\d+$/)) {
          isRightNumber = true;
        }
        else {
          await SendText("Eso no es un número válido, intenta de nuevo");
        }
      } while (!isRightNumber);

      await SendText("Se ha registrado el número");

      await SendText("Estoy guardando la información...");
      await Kldb.player.create({
        data: {
          actualRank: validRank,
          phoneNumber: numberStr,
          profilePicturePath: imgName,
          role: validRole,
          username: name,
          whatsappNickName: whatsappNameOrNot
        }
      })

      const m: string[] = [];
      m.push("------ Se ha guardado exitosamente los datos siguientes: --------")
      m.push(`Ingame Username: ${name}`)
      m.push(`Role: Administrator | AD`);
      m.push(`Rango: ${validRank}`)
      m.push(`WhatsappNickName: ${whatsappNameOrNot}`)
      await bot.SendText(args.chatId, m.join("\n"));

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
        await SendText(JSON.stringify(error));
      }
      if (thereWasImgStored === "") {
        fs.unlinkSync(path.join("db", "players", thereWasImgStored + ".png"))
        await SendText("Imagen no cargada debido a que se abortó el proceso");
      }
    }
  }
}