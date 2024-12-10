import Bot from '../bot';
import { BotCommandArgs } from '../types/bot';
import { HelperRoleName, ICommand } from '../types/commands';
import { AllUtilsType } from '../utils/index_utils';


export default class CommandsHandler {
  private _commands: Record<string, ICommand>;

  get Commands() {
    return Object.entries(this._commands);
  }
  constructor() { this._commands = {}; }

  public AddCommand(commandObj: ICommand) {
    this._commands[commandObj.commandName] = commandObj;
  }

  public Exists(commandName: string): boolean {
    return !!(this._commands[commandName]);
  }

  public HasPermisionToExecute(commandName: string, privilege: HelperRoleName): boolean {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    if (foundCommand.roleCommand === "Cualquiera") return true;
    if (foundCommand.roleCommand === "Administrador" && privilege !== "Administrador") return false;
    if (foundCommand.roleCommand === "Miembro" && (privilege !== "Administrador" && privilege !== "Miembro")) return false;
    return true;
  }

  public Execute(commandName: string, bot: Bot, commandArgs: BotCommandArgs): boolean {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    foundCommand.onMsgReceived(bot, commandArgs);
    return true;
  }
}