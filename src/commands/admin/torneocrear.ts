import Bot from '../../bot';
import { CommandArgs, ICommand } from '../../botTypes';

export default class CreateTournamentCommand implements ICommand{
  commandName: string = "torneocrear";
  description: string = "Crear un torneo";
  async onMsgReceived(bot: Bot, args:CommandArgs) {
    
  }
}