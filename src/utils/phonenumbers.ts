import { WAMessage } from '@whiskeysockets/baileys';

export type WhatsNumber = {
  countryCode: string;
  number: string;
  fullRawCleanedNumber: string;
  whatsappId: string;
}

function isValidNumberStr(numberStr: string): boolean {
  const mentionRegex = /^@\d{13}$/;
  const userIdRegex = /^\d{13}@s.whatsapp.net$/;
  return mentionRegex.test(numberStr) || userIdRegex.test(numberStr);
}

export function GetPhoneNumberFromRawmsg(rawMsg: WAMessage): WhatsNumber | null {
  //Let's check if comes from private msg or group
  let number = rawMsg.key.participant || rawMsg.key.remoteJid || undefined;
  if (!number) return null;
  if (!isValidNumberStr(number)) return null;

  const numberCleaned = number.slice(0, number.indexOf("@"));
  return {
    countryCode: numberCleaned.slice(0, 3),
    fullRawCleanedNumber: numberCleaned,
    number: numberCleaned.slice(3),
    whatsappId: `${numberCleaned.slice(3)}@s.whatsapp.net`
  }
}

export function GetPhoneNumberFromMention(numberStr: string): WhatsNumber | null {
  if (!isValidNumberStr(numberStr)) return null;
  let number = numberStr.slice(1);
  return {
    countryCode: number.slice(0, 3),
    fullRawCleanedNumber: number,
    number: number.slice(3),
    whatsappId: `${number}@s.whatsapp.net`
  }
}

export function isAMentionNumber(mentionStr: string) {
  return /^@\d{13}$/.test(mentionStr);
}