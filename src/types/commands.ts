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

