import { MessageUpsertType, WAMessage } from '@whiskeysockets/baileys';

export type BaileysOnMessageObj = {
  messages: WAMessage[];
  type: MessageUpsertType;
  requestId?: string;
};