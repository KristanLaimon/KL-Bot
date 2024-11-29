import Bot from '../../bot';
import { ICommand, CommandArgs } from '../../types/bot_types';

export default class HelpCommand implements ICommand {
  commandName: string = 'help';
  description: string = 'Despliega esta pantalla de ayuda';

  async onMsgReceived(bot: Bot, args: CommandArgs) {
    const strs: string[] = [];
    const separator = '=================================';
    const title = '🌟 Lista de comandos disponibles 🌟';

    strs.push(separator);
    strs.push(title);
    strs.push(separator);
    strs.push(''); // Empty line for spacing

    // Format commands
    const maxCmdLength = Math.max(...bot.Commands.map(([_, cmd]) => cmd.commandName.length));
    for (const cmd of bot.Commands) {
      const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
      strs.push(`🔹 ${command}: ${cmd[1].description}`);
    }

    strs.push('');
    strs.push(separator);
    strs.push('Tip: Usa el comando para obtener más detalles.');

    // Send formatted message
    await bot.SendText(args.chatSenderId, strs.join('\n'));
  }
}
