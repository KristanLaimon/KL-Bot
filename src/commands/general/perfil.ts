import Kldb from '../../utils/db';
import Bot from '../../bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import { GetFormatedDurationDaysSince } from '../../utils/dates';
import { AllUtilsType } from '../../utils/index_utils';
import { BotCommandArgs } from '../../types/bot';

// TODO: Implement a 'usageInfo' for each command and make it accesible with some "helpCommand" function or something like that
export default class GetProfileInfoCommand implements ICommand {
  commandName: string = "perfil"
  description: string = "Obten la información de cualquier miembro del clan etiquetandolo con @ después del comando"
  roleCommand: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    if (args.commandArgs.length > 1) {
      await bot.SendText(args.chatId, "Debes etiquetar al miembro al que quieres consultar con el @ o si no mandas nada, se te desplegará tu propia información");
      return;
    }

    const wasSomeoneTagged: boolean = args.commandArgs.length == 1;
    const whatsNumberInfo = wasSomeoneTagged ?
      utils.PhoneNumber.GetPhoneNumberFromMention(args.commandArgs[0]) :
      utils.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalPromptMsgObj);

    if (whatsNumberInfo == null) {
      await bot.SendText(args.chatId, "No etiquetaste a nadie o el etiquetado es inválido (?)");
      return;
    }

    const cleanedNumber = whatsNumberInfo.fullRawCleanedNumber;
    try {
      //check if it is a registered member
      const member = await Kldb.player.findFirst({ where: { phoneNumber: cleanedNumber }, include: { Rank: true, Role: true } })
      if (!member) {
        await bot.SendText(args.chatId, "La persona etiquetada todavía no está registrado en este bot del clan");
        return;
      }


      const memberInfo =
        `======== Perfil =======
Username: ${member?.username}
Rango: ${member?.Rank.name}
Rol: ${member.Role.name}
Antiguedad: ${GetFormatedDurationDaysSince(member.joined_date)}`;
      await bot.SendText(args.chatId, memberInfo);
      const imgPlayerPath = utils.FileSystem.GetPlayerImagePath(member.username);
      await bot.SendImg(args.chatId, imgPlayerPath!);

    } catch (error) {
      await bot.SendText(args.chatId, "Ha ocurrido un error raro...");
    }
  }
}