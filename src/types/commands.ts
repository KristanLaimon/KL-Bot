import Bot from '../bot';
import { BotCommandArgs } from './bot';


/**
 * Admin: obvious
 * Miembro/Member: obvious
 * Invitado/Guest: Is someone that has entered into clan but not registered as member yet
 * Cualquier/Anyone: Is anyone, from inside or outside the bot
 */
export type HelperRoleName = "Administrador" | "Miembro" | "Cualquiera"
export type CommandAccessibleRoles = HelperRoleName | "Secreto";
export type CommandScopeType = "External" | "Group";
export type CommandHelpInfo = {
  /**
   * General info and notes
   */
  notes?: string,
  /**
   * Structure/sintaxis of the help message
   * !command [optional argument] mandatoryargument(número) etc... 
   */
  structure: string,
  /**
   * Examples of how to use the command. These will be shown in the help message.
   * Should be an array of strings, each string should be a different example of how to use the command
   * For example, if your command is !hello, you should add an example like "!hello (without arguments)"
   */
  examples: { text: string, isOk: boolean }[]
}

export interface ICommand {
  /**
   * The name of the command
   */
  commandName: string;
  /**
   * A short description of what the command does
   */
  description: string;
  /**
   * The minimum role required to use this command
   */
  minimumRequiredPrivileges: CommandAccessibleRoles;
  /**
   * The maximum scope in which this command can be used
   */
  maxScope: CommandScopeType;
  /**
   * A help message to show to the user
   */
  helpMessage?: CommandHelpInfo;
  /**
   * The function to call when the command is received
   * @param bot the bot instance
   * @param args the arguments passed to the command
   */
  onMsgReceived: (bot: Bot, args: BotCommandArgs) => Promise<void>;
}
type CommandOnMsgReceivedType = (bot: Bot, args: BotCommandArgs) => Promise<void>
export type ICommandExtension = {
  /**
   * The function to call when the command is received, its design to be just a helper command extension from a father/bigger one
   * @param bot the bot instance
   * @param args the arguments passed to the command
   */
  onMsgReceived: (bot: Bot, args: BotCommandArgs, originalCommand: ICommand) => Promise<void>;
}

export enum SenderType {
  Group,
  Individual,
}

export enum MsgType {
  text,
  image,
  sticker,
  video,
  audio,
  contact,
  unknown
}

