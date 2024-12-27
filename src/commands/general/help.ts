import { HelperRoleName, ICommand, ScopeType } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { Members_GetMemberInfoFromPhone } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawmsg } from '../../utils/phonenumbers';
import { SpecificChat } from '../../bot/SpecificChat';
import { Str_CapitalizeStr, Str_NormalizeLiteralString } from '../../utils/strings';

export default class Help_GroupCommand implements ICommand {
  commandName: string = 'help';
  minimumRequiredPrivileges: HelperRoleName = "Cualquiera";
  description: string = 'Despliega esta pantalla de ayuda';
  maxScope: ScopeType = "Group"
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    //If there are arguments
    //Feature: Get info about how to use a command
    if (args.commandArgs.length > 0) {
      const chat = new SpecificChat(bot, args);
      if (args.commandArgs.length > 1) {
        await chat.SendTxt("Para ver la ayuda y el cómo usar un comando solo se permite un argumento: El nombre del comando en cuestión. Ejemplo: !help miembros")
      }
      const commandName = args.commandArgs[0];

      const command = bot.Commands.find(cmd => cmd[1].commandName.toLowerCase() == commandName.toLowerCase());
      if (command) {
        if (!command[1].helpMessage) {
          await chat.SendTxt("No hay ayuda disponible para este comando, intentalo con un comando diferente.");
        }
        else {
          await chat.SendTxt(`
          === 🌟 Ayuda: ${Str_CapitalizeStr(command[0])} 🌟 ===

          📖 **Descripción:**
          ${command[1].description}

          🛠️ **Estructura:**
          \`\`\`
          ${Str_NormalizeLiteralString(command[1].helpMessage.structure)}
          \`\`\`

          💡 **Ejemplos:**
          ${command[1].helpMessage.examples.map(example => "  - " + Str_NormalizeLiteralString(example)).join("\n")}

          ℹ️ **Información Adicional:**
          ${Str_NormalizeLiteralString(command[1].helpMessage.info)}
        `);

        }
      }
      else {

      }
      return;
    }

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
