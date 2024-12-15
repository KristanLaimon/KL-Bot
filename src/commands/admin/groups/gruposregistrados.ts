import moment from 'moment';
import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandAccessibleRoles, ScopeType } from '../../../types/commands';
import Kldb from '../../../utils/db';

export default class RegisteredGroupsCommand implements ICommand {
  commandName: string = "gruporegistrado";
  description: string = "Consulta todos los grupos en los que el bot está permitido interactuar";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: ScopeType = "Group";

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const groupsRegistered = await Kldb.registeredWhatsappGroups.findMany();
      await chat.SendTxt("========= Grupos Registrados ========");

      if (groupsRegistered.length === 0) {
        await chat.SendTxt("No hay grupos registrados todavía...");
        return
      }

      const msgToSend = groupsRegistered
        .map((info, i) =>
          `${i + 1}. ${info.group_name} | Registrado en: ${moment(Number(info.date_registered)).format('dddd, MMMM Do YYYY, h:mm A')}`)
        .join('\n');
      await chat.SendTxt(msgToSend)
    } catch (e) {
      await chat.SendTxt("Ocurrió un error con la base de datos por alguna razón...");
    }
  }
}