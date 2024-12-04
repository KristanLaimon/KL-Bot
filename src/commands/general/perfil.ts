import Kldb from '../../../main';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot';
import { PlayerImage } from '../../imgDb';
import { CommandArgs, ICommand } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';

// TODO: Implement a 'usageInfo' for each command and make it accesible with some "helpCommand" function or something like that
export default class GetProfileInfoCommand implements ICommand {
  commandName: string = "perfil"
  description: string = "Obten la información de cualquier miembro del clan etiquetandolo con @ después del comando"
  roleCommand: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    if (args.commandArgs.length > 1) {
      await bot.SendText(args.chatId, "Debes etiquetar al miembro al que quieres consultar con el @ o si no mandas nada, se te desplegará tu propia información");
      return;
    }
    //Args can be zero or one
    const wasSomeoneTagged: boolean = args.commandArgs.length == 1;
    try {
      if (wasSomeoneTagged) {
        const memberTagged: string = args.commandArgs[0];
        // check if it is a valid number in first place
        const memberTaggedNumber = utils.GetPhoneNumberFromMention(memberTagged);
        if (memberTagged == null) {
          await bot.SendText(args.chatId, "No etiquetaste a nadie o el etiquetado es inválido (?)");
          return;
        }
        //check if it is a registered member
        const member = await Kldb.player.findFirst({ where: { phoneNumber: memberTaggedNumber?.fullRawCleanedNumber }, include: { Rank: true } })
        if (member == null) {
          await bot.SendText(args.chatId, "La persona etiquetada todavía no está registrado en este bot del clan");
        }

        const memberInfo =
          `======== Perfil =======
Username: ${member?.username}
Rango: ${member?.Rank.name}
Perfil In Game:`;
        await bot.SendText(args.chatId, memberInfo);
        const imgPlayerPath = PlayerImage(member?.username!);
        await bot.SendImg(args.chatId, imgPlayerPath!);

      }
    } catch (error) {
      await bot.SendText(args.chatId, "Ha ocurrido un error raro...");
    }
  }
}