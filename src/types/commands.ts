import Bot from '../bot';
import { AllUtilsType } from '../utils/index_utils';
import { BotCommandArgs } from './bot';

export type HelperRoleName = "Administrador" | "Miembro";
export type CommandAccessibleRoles = HelperRoleName | "Secreto";

export interface ICommand {
  commandName: string;
  description: string;
  roleCommand: CommandAccessibleRoles;
  onMsgReceived: (bot: Bot, args: BotCommandArgs, utils: AllUtilsType) => Promise<void>;
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

