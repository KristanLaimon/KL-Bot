import { HelperRoleName, ICommand, ScopeType } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { AllUtilsType } from '../../utils/index_utils';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';

export default class Help_GroupCommand implements ICommand {
  commandName: string = 'help';
  minimumRequiredPrivileges: HelperRoleName = "Cualquiera";
  description: string = 'Despliega esta pantalla de ayuda';
  maxScope: ScopeType = "Group"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const strs: string[] = [];
    const maxCmdLength = Math.max(...bot.Commands.map(([_, cmd]) => cmd.commandName.length));
    const separator = '----------------------------------';
    const title = '🌟 *Comandos Disponibles* 🌟';

    strs.push(title);
    strs.push(separator);

    // Comandos generales (everyone)
    const everyoneCommands = bot.Commands.filter(com => com[1].minimumRequiredPrivileges == "Cualquiera" && com[1].maxScope == "Group");
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
      const generalCommands = bot.Commands.filter(com => com[1].minimumRequiredPrivileges == "Miembro" && com[1].maxScope == "Group");
      // strs.push('*Comandos para Miembros:*');
      generalCommands.forEach(cmd => {
        const command = cmd[1].commandName.padEnd(maxCmdLength + 2, ' ');
        strs.push(`🔹 ${command}: ${cmd[1].description}`);
      });
      strs.push('');

      // Si es admin, agregar comandos de Admin
      if (memberInfo.role === "AD") {
        const adminCommands = bot.Commands.filter(com => com[1].minimumRequiredPrivileges == "Administrador" && com[1].maxScope == "Group");
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
