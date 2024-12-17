import * as winston from 'winston';
import { format } from 'date-fns'; // Use date-fns for timestamp formatting
import { WAMessage } from '@whiskeysockets/baileys';
import { MsgType, SenderType } from '../types/commands';
import { Msg_GetChatIdFromRawMsg, Msg_GetMsgTypeFromRawMsg, Msg_GetSenderTypeFromRawMsg } from '../utils/rawmsgs';

/**
 * Creates and configures the default KL Bot logger for logging messages with custom timestamp formatting.
 * @returns {winston.Logger} - A configured winston logger instance.
 */
const KlLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(), // Keep the default timestamp
    winston.format.printf(({ level, message, timestamp }) => {
      const humanTimestamp = format(new Date(timestamp as string), 'EEEE dd MMMM h:mm aa');
      return `${humanTimestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    // Logs all warnings and above to `warnings.log`
    new winston.transports.File({ filename: 'logs/warnings_errors.log', level: 'warn' }),

    // Logs all messages to `all.log`
    new winston.transports.File({ filename: 'logs/all.log' }),

    // Logs to the console
    new winston.transports.Console(),
  ],
});
export default KlLogger;

export const KlCommandLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/commands_executed.log' }),
  ],
});

// ------------------------------------------------------------------------------------

import * as fs from "fs";
import { KldbCacheAllowedWhatsappGroups } from '../utils/db';

const Default_Log_Msg_ObjectJson = {
  Individual: {
    text: [],
    media: [],
  },
  RegisteredGroup: {
    text: [],
    media: [],
  },
  NonRegisteredGroup: {
    text: [],
    media: [],
  }
}
type LogMsgObjectJson = {
  Individual: {
    text: WAMessage[];
    media: WAMessage[];
  };
  RegisteredGroup: {
    text: WAMessage[];
    media: WAMessage[];

  };
  NonRegisteredGroup: {
    text: WAMessage[];
    media: WAMessage[];
  };
};

import * as path from 'path';
const ensureFileWithDefaultContentExists = (filePath: string, defaultObj: Record<string, unknown>): void => {
  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      // Ensure the directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the default object as JSON
      fs.writeFileSync(filePath, JSON.stringify(defaultObj, null, 2), 'utf-8');
      console.log(`File created at ${filePath} with default content.`);
    }
  } catch (err) {
    console.error(`Error ensuring file exists: ${err}`);
    throw err; // Rethrow the error for upstream handling
  }
};

const saveIntoMsgJsonFile = (rawMsg: WAMessage, senderType: SenderType, msgType: MsgType) => {
  const pathh = 'logs/msgslog.json'
  ensureFileWithDefaultContentExists(pathh, Default_Log_Msg_ObjectJson);
  const currentData = JSON.parse(fs.readFileSync(pathh).toString()) as LogMsgObjectJson;

  if (senderType === SenderType.Individual) {
    if (msgType === MsgType.text)
      currentData.Individual.text.push(rawMsg);
    else
      currentData.Individual.media.push(rawMsg);
  }
  else if (senderType === SenderType.Group) {
    const chatId = Msg_GetChatIdFromRawMsg(rawMsg);
    const isRegisteredGroup = KldbCacheAllowedWhatsappGroups.find(chats => chats.chat_id === chatId);

    if (isRegisteredGroup) {
      if (msgType === MsgType.text)
        currentData.RegisteredGroup.text.push(rawMsg);
      else
        currentData.Individual.media.push(rawMsg);
    }
    else {
      if (msgType === MsgType.text)
        currentData.NonRegisteredGroup.text.push(rawMsg);
      else
        currentData.NonRegisteredGroup.media.push(rawMsg);
    }
  }

  fs.writeFileSync(pathh, JSON.stringify(currentData, null, 2));
}

/**
 * Logs messages received by the bot, categorizing them based on sender type and message type.
 * @param rawMessage - The raw message object received from WhatsApp Web.
 * @param commandsHandler - The instance of the CommandsHandler class, used to handle command-related logic.
 * @throws Will throw an error if the sender type is neither individual nor group.
 * @remarks
 * To categorize a registered group NEEDS TO CALL KldbUpdateCacheAsync() at least once before this method! side effect(?), not critical error
 */
export function Log_LogRawMsg(rawMessage: WAMessage): void {
  const senderType = Msg_GetSenderTypeFromRawMsg(rawMessage);
  const msgType = Msg_GetMsgTypeFromRawMsg(rawMessage);
  saveIntoMsgJsonFile(rawMessage, senderType, msgType)
}



//What i need to store
//individual - no command (text)
//nonregisteredgroup - no command (text)
//registeredgroup - no command (text)

//individual - no command (any other type of msg)
//nonregisteredgroup - no command (any other type of msg)
//registeredgroup - no command (any other type of msg)

//individual - command (text)
//nonregisteredgroup - command (text)
//registeredgroup - command (text)

//wrong command (bad written with a ! prefix)

