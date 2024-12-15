import { WAMessage } from '@whiskeysockets/baileys';

export type WhatsNumber = {
  countryCode: string;
  numberWithNoCountryCode: string;
  number: string;
  whatsappId: string;
}

export const Phone_MentionNumberRegex = /^@\d{13}$/;
export const Phone_UserIdRegex = /^\d{13}@s.whatsapp.net$/;

export const Phone_MentionNumberRegexStr = "@\\d{13}"
export const Phone_UserIdRegexStr = "\\d{13}@s.whatsapp.net";

export function Phone_GetFullPhoneInfoFromRawmsg(rawMsg: WAMessage): WhatsNumber {
  //Let's check if comes from private msg or group
  let number = rawMsg.key.participant || rawMsg.key.remoteJid || undefined;
  if (!number) throw new Error("This shouln't happen, library never gives both participant and remoteJid as undefined, only one of them");
  if (!Phone_IsValidNumberStr(number)) throw new Error("???, Phone number must be alway valid, just a small validation");

  const numberCleaned = number.slice(0, number.indexOf("@"));
  return {
    countryCode: numberCleaned.slice(0, 3),
    number: numberCleaned,
    numberWithNoCountryCode: numberCleaned.slice(3),
    whatsappId: `${numberCleaned.slice(3)}@s.whatsapp.net`
  }
}

export function Phone_GetPhoneNumberFromMention(numberStr: string): WhatsNumber | null {
  if (!Phone_IsValidNumberStr(numberStr)) return null;
  let number = numberStr.slice(1);
  return {
    countryCode: number.slice(0, 3),
    number: number,
    numberWithNoCountryCode: number.slice(3),
    whatsappId: `${number}@s.whatsapp.net`
  }
}

export function Phone_IsAMentionNumber(mentionStr: string) {
  return /^@\d{13}$/.test(mentionStr);
}

function Phone_IsValidNumberStr(numberStr: string): boolean {
  return Phone_MentionNumberRegex.test(numberStr) || Phone_UserIdRegex.test(numberStr);
}

