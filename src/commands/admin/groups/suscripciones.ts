import moment from 'moment';
import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandAccessibleRoles, CommandScopeType, CommandHelpInfo } from '../../../types/commands';
import GlobalCache from '../../../bot/cache/GlobalCache';

export default class RegisteredGroupsCommand implements ICommand {
  commandName: string = "suscripciones";
  description: string = "Consulta todos los grupos en los que el bot está permitido interactuar";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: CommandScopeType = "Group";
  helpMessage: CommandHelpInfo = {
    structure: "suscripciones",
    examples: [{ text: "suscripciones", isOk: true }, { text: "suscripciones someotherargument", isOk: false }],
    notes: "Muestra todos los grupos en los que el bot está permitido interactuar"
  };

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    if (GlobalCache.SemiAuto_AllowedWhatsappGroups.length === 0) {
      await chat.SendTxt("No hay grupos registrados todavía...");
      return
    }
    const msgToSend = GlobalCache.SemiAuto_AllowedWhatsappGroups
      .map((info, i) =>
        `${i + 1}. ${info.group_name} | Registrado en: ${moment(Number(info.date_registered)).format('dddd, MMMM Do YYYY, h:mm A')}`)

    let finalMsg = ['===== Grupos Suscritos actualmente ======', ...msgToSend].join("\n");
    await chat.SendTxt(finalMsg);
  }
}