import moment from 'moment';
import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import { Dates_SpanishMonthStr, Dates_SpanishMonthToNumber } from '../../utils/dates';
import { AllUtilsType } from '../../utils/index_utils';
import { Msg_GetTextFromRawMsg, Msg_IsBotWaitMessageError } from '../../utils/rawmsgs';
import Kldb from '../../utils/db';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';


export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  roleCommand: CommandAccessibleRoles = "Administrador"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      chat.SendTxt("Esperaré hasta que mandes alguna 'tasa'...");
      const respondedWithTasa = await bot.Receive.WaitUntilRawTxtMsgFromPhone(args.chatId, args.userId, Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg)!.number, /tasa/i, 30);
      chat.SendTxt("Finalmente respondiste tasa cabrón");
      chat.SendTxt(`Respondiste así: La cagada va en la *${Msg_GetTextFromRawMsg(respondedWithTasa)}*`)

      // const allMembers = (await Kldb.player.findMany({ include: { Rank: true, Role: true } }));
      // const selectedMember =
      //   await chat.DialogWaitAnOptionFromListObj(
      //     allMembers,
      //     (memberObjInfo) => memberObjInfo.username,
      //     "Selecciona a un miembro:",
      //     "Ese miembro no existe intenta de nuevo:",
      //     (memberObj, index) => `${index}. ${memberObj.Role.name} ${memberObj.Rank.name} | ${memberObj.username}`,
      //     250
      //   );

      // const algo = 3

      // const msg = await chat.DialogWaitAnOptionFromList(
      //   allPossibleGreetings,
      //   "Intenta mandar un saludo escrito de los siguientes:",
      //   "Ese rango no existe, prueba con alguno de los siguientes:",
      //   (e) => `🦊 ${e}`
      // );
      // await chat.SendTxt(`Has respondido correctamente con: ${msg}`);

      // await chat.SendTxt(`
      //   Brinda la fecha en la que se unió el miembro en el formato:
      //   AÑO/MES/DIA. Ejemplo: 2024/octubre/24
      //   Si quieres que sea el día de hoy escribe:  *hoy*
      // `);
      // const dateInput = await chat.WaitNextTxtMsgFromSenderSpecific(
      //   new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/\\d{1,2}\\s*$`, "i"),
      //   "Formato de fecha incorrecta. Ejemplo de como debería ser: 2024/diciembre/01",
      //   250
      // )
      // const dateInputPartes = dateInput.trim().split('/');
      // const monthNumber = Dates_SpanishMonthToNumber(dateInputPartes.at(1)!)!;
      // const dateParsed = dateInput.replace(dateInputPartes.at(1)!, monthNumber.toString());
      // const dateInputMomentJs = moment(dateInput); // Suponiendo que dateInput es válido
    } catch (e) {
      if (Msg_IsBotWaitMessageError(e))
        if (!e.wasAbortedByUser) await chat.SendTxt("Se te acabó el tiempo"); else await chat.SendTxt("Has cancelado el saludo..");
    }
  }
}