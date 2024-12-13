import { HelperRoleName, ICommand } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';

export default class HelpCommand implements ICommand {
  commandName: string = 'help';
  roleCommand: HelperRoleName = "Cualquiera";
  description: string = 'Despliega esta pantalla de ayuda';

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const strs: string[] = [];
    const maxCmdLength = Math.max(...bot.Commands.map(([_, cmd]) => cmd.commandName.length));
    const separator = '----------------------------------';
    const title = '🌟 *Comandos Disponibles* 🌟';

    strs.push(title);
    strs.push(separator);

    // Comandos generales (everyone)
    const everyoneCommands = bot.Commands.filter(com => com[1].roleCommand == "Cualquiera");
    // strs.push('*Comandos para Todos:*');
    everyoneCommands.forEach(cmd => {
      const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
      strs.push(`🔹 ${command}: ${cmd[1].description}`);
    });
    strs.push('');

    // Verificar si es miembro o admin
    const memberInfo = await Members_GetMemberInfoFromPhone(Phone_GetFullPhoneInfoFromRawmsg(args.originalMsg)!.number);
    if (memberInfo) {
      // Comandos para Miembros
      const generalCommands = bot.Commands.filter(com => com[1].roleCommand == "Miembro");
      // strs.push('*Comandos para Miembros:*');
      generalCommands.forEach(cmd => {
        const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
        strs.push(`🔹 ${command}: ${cmd[1].description}`);
      });
      strs.push('');

      // Si es admin, agregar comandos de Admin
      if (memberInfo.role === "AD") {
        const adminCommands = bot.Commands.filter(com => com[1].roleCommand == "Administrador");
        strs.push('*Comandos de Administrador:*');
        adminCommands.forEach(cmd => {
          const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
          strs.push(`🔹 ${command}: ${cmd[1].description}`);
        });
        strs.push('');
      }
    }

    strs.push(separator);
    strs.push('Tip: Usa el comando para más detalles.');

    // Enviar mensaje formateado
    await bot.Send.Text(args.chatId, strs.join('\n'));
  }
}
