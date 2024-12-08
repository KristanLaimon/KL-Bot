import { CommandAccessibleRoles, ICommand, MsgType } from '../../types/commands';
import fs from 'fs';
import Kldb from '../../utils/db';
import path from 'path';
import { CapitalizeStr } from '../../utils/strings';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';
import Bot from '../../bot';

export default class AddMemberCommand implements ICommand {
  commandName: string = "addmember";
  description: string = "Añade un nuevo miembro al bot";
  roleCommand: CommandAccessibleRoles = "Administrador";
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    const t = utils.Msg.CreateSenderReplyToolKit(bot, args);

    const separator = "=======================";
    const SendText = async (msg: string) => await bot.SendText(args.chatId, msg);
    let thereWasImgStored: string = "";
    try {
      //Welcome to command
      await bot.SendText(args.chatId,
        `${separator}
Añadiendo un nuevo administrador
${separator}`);

      // 1.1 of 5: Member role
      await SendText(`${separator}\nEnvía el rango del usuario:`);
      let allRolesAvailableText = (await Kldb.role.findMany())
        .map(roleObj => `🐺 ${roleObj.name}`)
        .join('\n');

      let validRole: string | undefined;
      do {
        //TODO: Implement a force type expecting response logic
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
        wasValidImg = await utils.FileSystem.DownloadMedia(
          await bot.WaitRawMessageFromId(
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
          const local = utils.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalPromptMsgObj);
          if (local !== null) {
            numberStr = local.fullRawCleanedNumber
            isRightNumber = true;
          } else {
            await SendText("Eso no es un número válido, intenta de nuevo");
          }
        } else if (utils.PhoneNumber.isAMentionNumber(numberStr)) {
          const local = utils.PhoneNumber.GetPhoneNumberFromMention(numberStr);
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


      // await SendText(
      //   `Brinda la fecha en la que se unió el miembro en el formato:
      //    AÑO/MES/DIA. Ejemplo: 2024/octubre/24
      //    Si quieres que sea el día de hoy escribe:  hoy`)
      // const dateInput = bot.WaitSpecificTextMessageFrom(args.chatId, args.userId, { regex: /^\d{4} \w+ \d{1,2}$/, incorrectMsg: "Formato de fecha incorrecta, vuelve a intentarlo..." })

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
      if (utils.Msg.isBotWaitMessageError(error)) {
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
      if (thereWasImgStored !== "") {
        fs.unlinkSync(path.join("db", "players", thereWasImgStored + ".png"))
        await SendText("Imagen no cargada debido a que se abortó el proceso");
      }
    }
  }
}