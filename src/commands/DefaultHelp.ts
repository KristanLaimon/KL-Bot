import Bot from '../bot';
import { SpecificChat } from '../bot/SpecificChat';
import { BotCommandArgs } from '../types/bot';
import { ICommand, CommandAccessibleRoles, ScopeType, SenderType } from '../types/commands';
import { Str_NormalizeLiteralString } from '../utils/strings';

//Default command to execute when a user is in chat private and doesnt send any valid command!
export default class DefaultHelp implements ICommand {
  commandName: string = "---";
  description: string = "---";
  roleCommand: CommandAccessibleRoles = "Cualquiera";
  maxScope: ScopeType = "External";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    if (args.senderType !== SenderType.Individual)
      return;

    const chat = new SpecificChat(bot, args);
    const msg = `
    === 🌟 *¡Bienvenido a KL BOT!* 🌟 ===

    ¡Hola! Soy el bot oficial del clan KL, diseñado para ofrecerte herramientas exclusivas para gestionar el clan de *Kings Of Logic*. 🚀
    
    🛠️ *Funciones:*
    - Administración de clanes
    - Organización de torneos
    - Entre otros

    🔍 Descubre todos mis comandos escribiendo *!help*.
    🐺 Si quieres saber todos los comandos dentro de un grupo en el que yo acabara de ser ingresado, usa *!ayuda* en su lugar
    🦊 Me encontrarás principalmente en el grupo oficial del clan, echa un vistazo
    `;
    await chat.SendImg('resources/wolf.jpg', Str_NormalizeLiteralString(msg));
  }
}