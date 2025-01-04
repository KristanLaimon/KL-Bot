import { HelperRoleName, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { Members_GetMemberInfoFromWhatsappId } from '../../utils/members';
import { Phone_GetFullPhoneInfoFromRawMsg } from '../../utils/phonenumbers';
import { SpecificChat } from '../../bot/SpecificChat';
import { Str_CapitalizeStr, Str_NormalizeLiteralString } from '../../utils/strings';
import CommandsHandler from "../../bot/Commands";

export default class Help_GroupCommand implements ICommand {
  commandName: string = 'help';
  minimumRequiredPrivileges: HelperRoleName = "Cualquiera";
  description: string = 'Despliega esta pantalla de ayuda';
  scopes: CommandScopeType[] = ["General", "TournamentValidator", "UnregisteredGroup"]
  helpMessage?: CommandHelpInfo = {
    structure: "help",
    examples: [
      { text: "help", isOk: true },
      { text: "help someotherargument", isOk: false }
    ],
    notes: "No tiene mucho chiste, es solo el comando de ayuda, como se te ocurrió pedir ayuda de esto (!?) 🦊"
  }
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    await chat.SendReactionToOriginalMsg("⌛");
    // Si hay argumentos
    if (args.commandArgs.length > 0) {
      if (args.commandArgs.length > 1) {
        await chat.SendText(
          "Para ver la ayuda de un comando, usa solo un argumento: el nombre del comando. Ejemplo: !help miembros"
        );
        await chat.SendReactionToOriginalMsg("✅");
        return;
      }

      const commandName = args.commandArgs[0];
      const command = bot.Commands.find(
        cmd => cmd[1].commandName.toLowerCase() === commandName.toLowerCase()
      );

      if (command) {
        if (!command[1].helpMessage) {
          await chat.SendText("No hay ayuda disponible para este comando. Intenta con otro.");
        } else {
          const helpMessage = `
            === 🌟 Ayuda: ${Str_CapitalizeStr(command[0])} 🌟 ===
            📖 ${command[1].description}

            🛠️ *Estructura:*
            \`\`\`
            ${bot.config.prefix}${Str_NormalizeLiteralString(command[1].helpMessage.structure)}
            \`\`\`
            💡 *Ejemplos:*
            ${command[1].helpMessage.examples
              .map(example => `  ${example.isOk ? "✅" : "❌"} ${bot.config.prefix}${Str_NormalizeLiteralString(example.text)}`)
              .join("\n")}

            ${command[1].helpMessage.notes && "ℹ️ *Información adicional:*"}
            ${Str_NormalizeLiteralString(command[1].helpMessage.notes)}
          `;
          await chat.SendText(helpMessage.trim());
        }
      } else {
        await chat.SendText(
          "Ese comando no existe. Consulta los comandos disponibles con !help."
        );
      }
      return;
    }

    // Construcción del mensaje de ayuda general
    const strs: string[] = [];
    const separator = "----------------------------------";
    const title = "🌟 *Comandos Disponibles* 🌟";

    strs.push(title, separator);

    const formatCommand = cmd => `🔹 ${cmd.commandName}: ${cmd.description}`;

    // Comandos generales (todos)
    const everyoneCommands = bot.Commands.filter(
      com => com[1].minimumRequiredPrivileges === "Cualquiera" && CommandsHandler.CommandHasScope(com[1], args.scopeCalled)
    );
    if (everyoneCommands.length > 0) {
      strs.push("*🔓 Comandos para todos:*");
      strs.push(...everyoneCommands.map(cmd => formatCommand(cmd[1])));
    }

    // Verificar si es miembro o admin
    const memberInfo = await Members_GetMemberInfoFromWhatsappId(
      Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)!.whatsappId
    );

    if (memberInfo) {
      // Comandos para miembros
      const memberCommands = bot.Commands.filter(
        com => com[1].minimumRequiredPrivileges === "Miembro" && CommandsHandler.CommandHasScope(com[1], args.scopeCalled)
      );
      if (memberCommands.length > 0) {
        strs.push("\n*🛡️ Comandos para miembros:*");
        strs.push(...memberCommands.map(cmd => formatCommand(cmd[1])));
      }

      // Comandos para administradores
      if (memberInfo.role === "AD") {
        const adminCommands = bot.Commands.filter(
          com => com[1].minimumRequiredPrivileges === "Administrador" && CommandsHandler.CommandHasScope(com[1], args.scopeCalled)
        );
        if (adminCommands.length > 0) {
          strs.push("\n*⚙️ Comandos de administrador:*");
          strs.push(...adminCommands.map(cmd => formatCommand(cmd[1])));
        }
      }
    }

    strs.push(separator, "🦊 Tip: Usa `!help [nombrecomando]` para detalles.");

    // Enviar mensaje formateado
    await bot.Send.Text(args.chatId, strs.join("\n"), true, { quoted: args.originalMsg});
    await chat.SendReactionToOriginalMsg("✅");
  }
}
