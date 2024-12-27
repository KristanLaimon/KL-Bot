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
export type ScopeType = "External" | "Group";

export interface ICommand {
  commandName: string;
  description: string;
  minimumRequiredPrivileges: CommandAccessibleRoles;
  maxScope: ScopeType;
  helpMessage?: {
    /**
     * General info and notes
     */
    info: string,
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
    examples: string[]
  }
  onMsgReceived: (bot: Bot, args: BotCommandArgs) => Promise<void>;
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

