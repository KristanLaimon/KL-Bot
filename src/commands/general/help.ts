import Bot from '../../bot';
import { CommandArgs, ICommand } from '../../botTypes';

export default class HelpCommand implements ICommand {
  commandName: string = 'help';
  description: string = 'Despliega esta pantalla de ayuda'
  async onMsgReceived(bot: Bot, args: CommandArgs) {
    const strs: string[] = [];
    strs.push('Lista de comandos disponibles:')
    strs.push('');
    
    for (const cmd of bot.Commands) {
      strs.push(`${cmd[1].commandName} - ${cmd[1].description}`);
    }

    await bot.SendText(args.chatSenderId, strs.join('\n'));
  }
}