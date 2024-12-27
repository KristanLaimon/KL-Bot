import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, ScopeType, CommandAccessibleRoles } from '../../types/commands';

export default class c implements ICommand {
  commandName: string = "entrartorneo";
  description: string = "Te permite entrar en algun torneo que esté abierto actualmente";
  maxScope: ScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {

  }
}

