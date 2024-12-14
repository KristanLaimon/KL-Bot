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
    if (commandObj.roleCommand !== "Administrador" && commandObj.roleCommand !== "Cualquiera" && commandObj.roleCommand !== "Miembro" && commandObj.roleCommand !== "Secreto")
      throw new Error(`Invalid role command for command '${commandObj.commandName}'. Role command must be 'Administrador', 'Cualquiera', 'Miembro', or 'Secreto'.`);

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
   *          Returns false if the command doesn't exist or if the user's privilege level is insufficient.
   *          Returns true if the user has the required privilege level to execute the command.
   */
  public HasPermisionToExecute(commandName: string, privilege: HelperRoleName): boolean {
    commandName = commandName.toLowerCase();
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    if (foundCommand.roleCommand === "Cualquiera") return true;
    if (foundCommand.roleCommand === "Administrador" && privilege !== "Administrador") return false;
    if (foundCommand.roleCommand === "Miembro" && (privilege !== "Administrador" && privilege !== "Miembro")) return false;
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
  public Execute(commandName: string, bot: Bot, commandArgs: BotCommandArgs): boolean {
    if (!this.Exists(commandName)) return false;
    const foundCommand = this._commands[commandName];
    foundCommand.onMsgReceived(bot, commandArgs);
    return true;
  }

}