import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import { AllUtilsType } from '../../utils/index_utils';

export default class DuelWinCommand implements ICommand {
  commandName: string = "duelwin"
  description: string = "Para registrar un duelo pendiente realizado con !duel con otro miembro del clan"
  roleCommand: CommandAccessibleRoles = "Miembro"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {

  }
}