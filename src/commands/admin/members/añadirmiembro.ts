import fs from 'fs';
import moment from 'moment';
import path from 'path';
import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand, MsgType } from '../../../types/commands';
import { Dates_GetFormatedDurationTimeFrom, Dates_SpanishMonthStr, Dates_SpanishMonthToNumber } from '../../../utils/dates';
import Kldb from '../../../utils/db';
import { Db_TryToDownloadMedia } from '../../../utils/filesystem';
import { Phone_GetFullPhoneInfoFromRawmsg, Phone_GetPhoneNumberFromMention as Phone_GetFullPhoneNumberInfoFromMention, Phone_MentionNumberRegexStr } from '../../../utils/phonenumbers';
import { Msg_IsBotWaitMessageError } from '../../../utils/rawmsgs';
import { Str_CapitalizeStr } from '../../../utils/strings';

export default class AddMemberCommand implements ICommand {
  commandName: string = "añadirmiembro";
  description: string = "Añade un nuevo miembro al bot";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  maxScope: CommandScopeType = "Group";
  helpMessage: CommandHelpInfo = {
    structure: "añadirmiembro",
    examples: [
      { text: "añadirmiembro", isOk: true },
      { text: "añadirmiembro algunaotracosa", isOk: false }
    ],
    notes: "Este comando añade un nuevo miembro al grupo introduciendo sus datos esenciales para pertenecer al clan. Solamente gente con privilegios de administrador puede usar este comando."
  }


  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    const separator = "=======================";
    let thereWasImgStored: string = "";

    try {
      await chat.SendTxt(`
        ${separator}
        Añadiendo un nuevo miembro
        ${separator}`
      );

      // MEMBER ROLE
      let allRoles = (await Kldb.role.findMany());
      let allRolesAvailableText = allRoles.map(roleObj => roleObj.name);
      let selectedRole = await chat.DialogWaitAnOptionFromList(
        allRolesAvailableText,
        "Envía el rango del usuario a insertar:",
        "No existe ese rol..., prueba de nuevo con algunos de los siguientes",
        (e, i) => `🦊 ${e}`,
        250
      );
      const selectedRoleId = allRoles.find(roleObj => roleObj.name === selectedRole)?.id;
      if (!selectedRoleId) throw new Error("wtfffff");

      // MEMBER NAME
      await chat.SendTxt("Brinda el nombre del nuevo miembro dentro del juego:")
      const name = await chat.WaitNextTxtMsgFromSender(250);

      // MEMBER RANK
      let allRanks = (await Kldb.rank.findMany());
      const allRanksAvailableText = allRanks.map(rankObj => rankObj.name.toLowerCase());
      const selectedRank = await chat.DialogWaitAnOptionFromList(
        allRanksAvailableText,
        "Selecciona el rango del miembro:",
        "Ese rango seleccionado no existe, prueba de nuevo...",
        (e) => `🐺 ${e}`,
        250
      );
      const selectedRankId = allRanks.find(rankobj => rankobj.name.toLowerCase() === selectedRank.toLowerCase())?.id;
      if (!selectedRankId) throw new Error("wtf");

      // MEMBER WHATSAPP NAME
      await chat.SendTxt("Pasame el nombre de whatsapp del nuevo miembro:");
      await chat.SendTxt("Si quieres que se registre tu nombre de usuario escribe:  *mio*");
      let whatsappName = await chat.WaitNextTxtMsgFromSender(250);
      if (whatsappName.includes("mio")) whatsappName = args.originalMsg.pushName!
      await chat.SendTxt(`Se ha seleccionado ${whatsappName}`);

      // MEMBER NUMBER PHONE
      await chat.SendTxt("Manda su número de whatsapp: (Puedes etiquetarlo con @) o poner *mio*");
      let rawUserNumberAnswer = await chat.WaitNextTxtMsgFromSenderSpecific(
        new RegExp(`^(${Phone_MentionNumberRegexStr}|mio)$`),
        "No es un número válido, intenta de nuevo",
        250
      );
      if (rawUserNumberAnswer.includes('mio')) rawUserNumberAnswer = Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg)!.number;
      else rawUserNumberAnswer = Phone_GetFullPhoneNumberInfoFromMention(rawUserNumberAnswer)!.number;
      await chat.SendTxt("Se ha registrado el número");

      //MEMBER DATE JOINED
      await chat.SendTxt(`
        Brinda la fecha en la que se unió el miembro en el formato:
        AÑO/MES/DIA. Ejemplo: 2024/octubre/24
        Si quieres que sea el día de hoy escribe:  *hoy*
      `);
      const dateInput = await chat.WaitNextTxtMsgFromSenderSpecific(
        new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/\\d{1,2}\\s*$`, "i"),
        "Formato de fecha incorrecta. Ejemplo de como debería ser: 2024/diciembre/01 ó 2024/diciembre/1",
        250
      )
      const dateInputPartes = dateInput.trim().split('/');
      const monthNumber = Dates_SpanishMonthToNumber(dateInputPartes.at(1)!)!;
      const dateParsed = dateInput.replace(dateInputPartes.at(1)!, monthNumber.toString());
      const dateInputMomentJs = moment(dateParsed); // Suponiendo que dateInput es válido
      await chat.SendTxt(`Antiguedad detectada: ${Dates_GetFormatedDurationTimeFrom(dateInputMomentJs.valueOf())}`);

      //MEMBER PROFILE PHOTO
      await chat.SendTxt("Brinda una captura/foto de su perfil dentro Rocket League Sideswipe:");
      let isValidImg = false;
      let imgName: string;
      do {
        imgName = `${selectedRankId}-${name}-${dateInputMomentJs.valueOf()}-profile-picture`;
        isValidImg = await Db_TryToDownloadMedia(
          await bot.Receive.WaitNextRawMsgFromId(
            args.chatId,
            args.userIdOrChatUserId,
            MsgType.image,
            250
          ),
          imgName,
          "png",
          "db/players"
        );
        if (isValidImg) chat.SendTxt("Se ha recibido correctamente la imagen")
        else chat.SendTxt("Imagen inválida, intenta de nuevo");
      } while (!isValidImg);
      thereWasImgStored = imgName;


      //FINISHING ==============================================================
      await chat.SendTxt("Estoy guardando la información...");
      await Kldb.player.create({
        data: {
          actualRank: selectedRankId,
          phoneNumber: rawUserNumberAnswer,
          profilePicturePath: imgName,
          role: selectedRoleId,
          username: name,
          whatsappNickName: whatsappName,
          joined_date: dateInputMomentJs.valueOf(),
        }
      })

      const m: string[] = [];
      m.push("------ Se ha guardado exitosamente los datos siguientes: --------")
      m.push(`Ingame Username: ${name}`)
      m.push(`Role: Administrator | AD`);
      m.push(`Rango: ${Str_CapitalizeStr(selectedRank)}`)
      m.push(`WhatsappNickName: ${whatsappName}`)
      m.push(`Antiguedad: ${Dates_GetFormatedDurationTimeFrom(dateInputMomentJs.valueOf())}`)
      await chat.SendTxt(m.join("\n"));

      await chat.SendTxt("===========Terminado==============");
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e)) {
        if (e.wasAbortedByUser) await chat.SendTxt("Se ha cancelado el proceso de creación del miembro");
        else await chat.SendTxt("Te has tardado demasiado en contestar.. vuelve a intentarlo");
      }
      else {
        await chat.SendTxt("Ha ocurrido un error extraño... toma una captura de esto y mandalo al creador del bot por favor para arreglarlo");
        await chat.SendTxt("Error en cuestión:")
        await chat.SendTxt(JSON.stringify(e));
      }
      if (thereWasImgStored !== "") {
        fs.unlinkSync(path.join("db", "players", thereWasImgStored + ".png"))
        await chat.SendTxt("Imagen no cargada debido a que se abortó el proceso");
      }
    }
  }
}



//       // 4 of 5: member profile photo sending
//       await SendText(`${separator}\nPaso 4 de 5: Brinda una captura/foto de su foto de perfil dentro del Rocket League Sideswipe:`);
//       let wasValidImg: boolean = false;
//       let imgName: string;
//       do {
//         imgName = `AD-${name}-${Date.now()}-profile-picture`;
//         wasValidImg = await utils.FileSystem.DownloadMedia(
//           await bot.WaitNextRawMsgFromId(
//             args.chatId,
//             args.userId,
//             MsgType.image, 60),
//           imgName,
//           "png",
//           "db/players"
//         )
//         if (!wasValidImg) {
//           await bot.SendTxtToChatId(args.chatId, "Invalid image, try again...");
//         } else
//           SendText("Se ha recibido correctamente la imagen");
//       } while (!wasValidImg);
//       thereWasImgStored = imgName;