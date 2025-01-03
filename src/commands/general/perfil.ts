
import Bot from '../../bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom, Dates_HumanizeDatesUntilDays } from '../../utils/dates';
import { BotCommandArgs } from '../../types/bot';
import { Phone_GetFullPhoneInfoFromRawmsg, Phone_GetPhoneNumberFromMention } from '../../utils/phonenumbers';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { SpecificChat } from '../../bot/SpecificChat';
import { FileSystem_GetPlayerImagePath } from '../../utils/filesystem';
import moment from 'moment';

export default class GetProfileInfoCommand implements ICommand {
  commandName: string = "perfil"
  description: string = "Obten la información de cualquier miembro del clan etiquetandolo con @ después del comando"
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  maxScope: CommandScopeType = "Group";
  helpMessage?: CommandHelpInfo = {
    structure: "perfil [@etiquetadealgunmiembro](Opcional)",
    examples: [
      { text: "perfil", isOk: true },
      { text: "perfil @alguien", isOk: true },
      { text: "perfil @deotrapersona", isOk: true },
      { text: "perfil @alguienmás @alguienmás", isOk: false },
    ],
    notes: "Si no se etiqueta a nadie, se despliega la información de ti mismo, pero si lo haces se desplegará el de aquella persona"
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    if (args.commandArgs.length > 1) {
      await bot.Send.Text(args.chatId, "Debes etiquetar al miembro al que quieres consultar con el @ o si no mandas nada, se te desplegará tu propia información", true, { quoted: args.originalMsg});
      await bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "❌");
      return;
    }

    const chat = new SpecificChat(bot, args);

    const wasSomeoneTagged: boolean = args.commandArgs.length == 1;
    const whatsNumberInfo = wasSomeoneTagged ?
      Phone_GetPhoneNumberFromMention(args.commandArgs[0]) :
      Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg);

    if (whatsNumberInfo == null) {
      await chat.SendTxt("No etiquetaste a nadie o el etiquetado es inválido (?)", true, { quoted: args.originalMsg});
      await bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "❌");
      return;
    }

    const member = await Members_GetMemberInfoFromPhone(whatsNumberInfo.number);
    if (member === null) {
      await bot.Send.Text(args.chatId, "La persona etiquetada todavía no está registrado en este bot del clan", true, { quoted: args.originalMsg});
      await bot.Send.ReactEmojiTo(args.chatId, args.originalMsg, "❌");
      return;
    }
    const msgToSend = `
      ======== Perfil =======
      Username: ${member?.username}
      Rango: ${member?.Rank.name}
      Rol: ${member.Role.name}
      Antigüedad: ${Dates_GetFormatedDurationTimeFrom(member.joined_date, { includingSeconds: false })}
    `;
    await chat.SendImg(FileSystem_GetPlayerImagePath(member.username)!, msgToSend, true, { quoted: args.originalMsg });
  }
}