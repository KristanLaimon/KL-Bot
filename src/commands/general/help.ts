import { HelperRoleName, ICommand } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';

export default class HelpCommand implements ICommand {
  commandName: string = 'help';
  roleCommand: HelperRoleName = "Miembro";
  description: string = 'Despliega esta pantalla de ayuda';

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const strs: string[] = [];
    const maxCmdLength = Math.max(...bot.Commands.map(([_, cmd]) => cmd.commandName.length));
    const separator = '=================================';
    const title = '🌟 Lista de comandos disponibles 🌟';

    strs.push(separator);
    strs.push(title);
    strs.push(separator);
    strs.push(''); // Empty line for spacing

    // Format commands
    const generalCommands = bot.Commands.filter(com => com[1].roleCommand == "Miembro");
    const adminCommands = bot.Commands.filter(com => com[1].roleCommand == "Administrador");

    strs.push('');
    strs.push("=== Comandos Generales ===");
    for (const cmd of generalCommands) {
      const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
      strs.push(`🔹 ${command}: ${cmd[1].description}`);
    }

    //Check if it' admin
    const memberInfo = await Members_GetMemberInfoFromPhone(Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg)!.number);
    if (memberInfo && memberInfo.role === "AD") {
      if (adminCommands.length > 0) {
        strs.push("=== Comandos de administrador ===");
        for (const cmd of adminCommands) {
          const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
          strs.push(`🔹 ${command}: ${cmd[1].description}`);
        }
      }
    }

    strs.push('');
    strs.push(separator);
    strs.push('Tip: Usa el comando para obtener más detalles.');

    // Send formatted message
    await bot.Send.Text(args.chatId, strs.join('\n'));
  }
}
