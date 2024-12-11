import Bot from '../bot';
import { BotCommandArgs } from './bot';

export type HelperRoleName = "Administrador" | "Miembro" | "Cualquiera";
export type CommandAccessibleRoles = HelperRoleName | "Secreto";


export interface ICommand {
  commandName: string;
  description: string;
  roleCommand: CommandAccessibleRoles;
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

