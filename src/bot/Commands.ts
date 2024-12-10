import Bot from '../bot';
import { BotCommandArgs } from '../types/bot';
import { HelperRoleName, ICommand } from '../types/commands';
import { AllUtilsType } from '../utils/index_utils';


export default class Commands {
  private _commands: Record<string, ICommand>;

  get Commands() {
    return Object.entries(this._commands);
  }

  constructor() {
    this._commands = {};
  }

  public AddCommand(commandObj: ICommand) {
    this._commands[commandObj.commandName] = commandObj;
  }

  public Exists(commandName: string): boolean {
    return !!(this._commands[commandName]);
  }

  public HasPermisionToExecute(commandName: string, privilege: HelperRoleName): boolean {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    if (privilege === "Administrador" && foundCommand.roleCommand !== "Administrador") return false;
    return true;
  }

  public Execute(commandName: string, bot: Bot, commandArgs: BotCommandArgs, allUtils: AllUtilsType): boolean {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    foundCommand.onMsgReceived(bot, commandArgs, allUtils);
    return true;
  }
}