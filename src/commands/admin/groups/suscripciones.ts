import moment from 'moment';
import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandAccessibleRoles, ScopeType } from '../../../types/commands';
import { KldbCacheAllowedWhatsappGroups } from '../../../utils/db';

export default class RegisteredGroupsCommand implements ICommand {
  commandName: string = "suscripciones";
  description: string = "Consulta todos los grupos en los que el bot está permitido interactuar";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: ScopeType = "Group";

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    if (KldbCacheAllowedWhatsappGroups.length === 0) {
      await chat.SendTxt("No hay grupos registrados todavía...");
      return
    }
    const msgToSend = KldbCacheAllowedWhatsappGroups
      .map((info, i) =>
        `${i + 1}. ${info.group_name} | Registrado en: ${moment(Number(info.date_registered)).format('dddd, MMMM Do YYYY, h:mm A')}`)

    let finalMsg = ['===== Grupos Suscritos actualmente ======', ...msgToSend].join("\n");
    await chat.SendTxt(finalMsg);
  }
}