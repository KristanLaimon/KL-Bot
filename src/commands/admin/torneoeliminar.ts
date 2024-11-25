import Bot from '../../bot';
import { CommandArgs, ICommand } from '../../botTypes';

export default class CreateTournamentCommand implements ICommand{
  commandName: string = "torneoeliminar"
  async onMsgReceived(bot: Bot, args:CommandArgs) {
    
  }
}