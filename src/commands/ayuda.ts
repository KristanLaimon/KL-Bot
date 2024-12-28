import Bot from '../bot';
import { SpecificChat } from '../bot/SpecificChat';
import { BotCommandArgs } from '../types/bot';
import { ICommand, CommandAccessibleRoles, CommandScopeType } from '../types/commands';

export default class ExternalHelp_AyudaCommand implements ICommand {
  commandName: string = "ayuda";
  description: string = "Obten ayuda en un grupo no registrado por este bot";
  maxScope: CommandScopeType = "External";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const strs: string[] = [];
    const separator = '----------------------------------';
    const title = '🌟 *Comandos Disponibles para este Grupo* 🌟';

    // Agregar título y separador
    strs.push(title);
    strs.push(separator);

    // Obtener comandos aplicables al contexto actual
    const externalCommands = bot.Commands.filter(command => command[1].maxScope === "External");
    if (externalCommands.length === 0) {
      strs.push('⚠️ No hay comandos disponibles para este grupo.');
    } else {
      // Determinar longitud máxima para alinear el texto
      const maxCmdLength = Math.max(...externalCommands.map(cmd => cmd[1].commandName.length));

      // Crear la lista de comandos disponibles
      externalCommands.forEach(command => {
        const { commandName, description } = command[1];
        const paddedCommand = commandName.padEnd(maxCmdLength + 2, ' ');
        strs.push(`🔹 ${paddedCommand}: ${description}`);
      });
    }

    strs.push(separator);
    strs.push('Tip: Usa un comando con el formato adecuado para más detalles.');

    // Enviar mensaje formateado al chat
    const chat = new SpecificChat(bot, args);
    await chat.SendTxt('🤖 Estás interactuando con un bot en un grupo no registrado. Aquí tienes la ayuda:');
    await chat.SendTxt(strs.join('\n'));
  }

}