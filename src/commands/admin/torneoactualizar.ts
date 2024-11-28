import Bot from '../../bot';
import { CommandArgs, ICommand } from '../../typos';

export default class CreateTournamentCommand implements ICommand{
  commandName: string = "torneoactualizar"
  description: string = "Tournament creation command default description omg foxxy"
  async onMsgReceived(bot: Bot, args:CommandArgs) {
    
  }
}