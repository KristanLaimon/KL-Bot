import Bot from '../../bot';
import { CommandArgs, ICommand } from '../../botTypes';

export default class CreateTournamentCommand implements ICommand{
  commandName: string = "torneoeliminar";
  description: string = "Eliminar un torneo existente";
  async onMsgReceived(bot: Bot, args:CommandArgs) {
    
  }
}