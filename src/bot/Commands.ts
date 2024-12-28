import Bot from '../bot';
import { BotCommandArgs } from '../types/bot';
import { HelperRoleName, ICommand, CommandScopeType } from '../types/commands';
import { Msg_IsBotWaitMessageError } from '../utils/rawmsgs';


export default class CommandsHandler {
  private _commands: Record<string, ICommand>;

  get Commands() {
    return Object.entries(this._commands);
  }

  constructor() { this._commands = {}; }

  /**
   * Adds a new command to the command registry.
   * 
   * @param commandObj - The command object to be added to the registry.
   *                     This object should implement the ICommand interface,
   *                     which includes properties like commandName and methods
   *                     for executing the command.
   * 
   * @returns void - This method doesn't return a value. It updates the internal
   *                 command registry by adding the new command.
   */
  public AddCommand(commandObj: ICommand) {
    commandObj.commandName = commandObj.commandName.toLowerCase()

    if (this._commands[commandObj.commandName])
      throw new Error(`Command with name '${commandObj.commandName}' already exists.`);

    this._commands[commandObj.commandName.toLowerCase()] = commandObj;
  }


  /**
   * Checks if a command exists in the command registry.
   * 
   * @param commandName - The name of the command to check for existence.
   * @returns A boolean indicating whether the command exists.
   *          Returns true if the command is found in the registry, false otherwise.
   */
  public Exists(commandName: string): boolean {
    return !!(this._commands[commandName]);
  }

  /**
   * Checks if a user has permission to execute a specific command based on their privilege level.
   *
   * @param commandName - The name of the command to check permissions for.
   * @param privilege - The privilege level of the user attempting to execute the command.
   * @returns A boolean indicating whether the user has permission to execute the command.
   */
  public HasPermissionToExecute(commandName: string, privilege: HelperRoleName): boolean {
    const privilegeRank: Record<HelperRoleName, number> = {
      "Administrador": 2,
      "Miembro": 1,
      "Cualquiera": 0
    };
    commandName = commandName.toLowerCase();
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    const requiredPrivilege = foundCommand.minimumRequiredPrivileges;
    return privilegeRank[privilege] >= privilegeRank[requiredPrivilege];
  }


  public HasCorrectScope(commandName: string, scope: CommandScopeType): boolean {
    commandName = commandName.toLowerCase();
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    if (foundCommand.maxScope !== scope) return false;
    return true;
  }

  /**
   * Executes a command if it exists in the command registry.
   * 
   * @param commandName - The name of the command to execute.
   * @param bot - The Bot instance on which to execute the command.
   * @param commandArgs - The arguments to pass to the command.
   * @returns A boolean indicating whether the command was successfully executed.
   *          Returns false if the command doesn't exist, true otherwise.
   */
  public async Execute(commandName: string, bot: Bot, commandArgs: BotCommandArgs): Promise<boolean> {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];

    await foundCommand.onMsgReceived(bot, commandArgs);

    return true;
  }

}