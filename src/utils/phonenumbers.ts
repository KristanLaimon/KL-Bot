import { WAMessage } from '@whiskeysockets/baileys';

export type WhatsNumber = {
  countryCode: string;
  numberCleanedWithNoCountryCode: string;
  numberCleaned: string;
  whatsappId: string;
  mentionFormatted: string
}

export const Phone_MentionNumberRegex = /^@\d{13}$/;
export const Phone_UserIdRegex = /^\d{13}@s.whatsapp.net$/;

export const Phone_MentionNumberRegexStr = "@\\d{13}"
export const Phone_UserIdRegexStr = "\\d{13}@s.whatsapp.net";

/**
 * Extracts detailed phone number information from a raw WhatsApp message.
 *
 * @param rawMsg - The raw WhatsApp message from which to extract the phone number.
 * @returns An object containing the phone number details, including country code, 
 *          full number, number without country code, and WhatsApp ID.
 *
 * @throws {Error} If the phone number is invalid or both participant and remoteJid are undefined.
 *
 * @example
 * const rawMsg = { key: { participant: '1234567890123@s.whatsapp.net' } };
 * const phoneInfo = Phone_GetFullPhoneInfoFromRawmsg(rawMsg);
 * // phoneInfo = {
 * //   countryCode: '123',
 * //   number: '1234567890123',
 * //   numberWithNoCountryCode: '4567890123',
 * //   whatsappId: '5214567890123@s.whatsapp.net'
 * // }
 */
export function Phone_GetFullPhoneInfoFromRawMsg(rawMsg: WAMessage): WhatsNumber {
  //Let's check if comes from private msg or group
  let number = rawMsg.key.participant || rawMsg.key.remoteJid || undefined;
  if (!number) throw new Error("This shouldn't happen, library never gives both participant and remoteJid as undefined, only one of them");
  if (!Phone_IsValidNumberStr(number)) throw new Error("???, Phone number must be always valid, just a small validation");
  return Phone_GetFullPhoneInfoFromId(number);

}

export function Phone_GetFullPhoneInfoFromId(fullIdStr:string):WhatsNumber {
   const numberCleaned = fullIdStr.slice(0, fullIdStr.indexOf("@"));
   return {
    countryCode: numberCleaned.slice(0, 3),
    numberCleaned: numberCleaned,
    numberCleanedWithNoCountryCode: numberCleaned.slice(3),
    whatsappId: fullIdStr,
    mentionFormatted: `@${numberCleaned}`
  }
}

export function Phone_GetPhoneNumberFromMention(numberStr: string): WhatsNumber | null {
  if (!Phone_IsValidNumberStr(numberStr)) return null;
  let number = numberStr.slice(1);
  return {
    countryCode: number.slice(0, 3),
    numberCleaned: number,
    numberCleanedWithNoCountryCode: number.slice(3),
    whatsappId: `${number}@s.whatsapp.net`,
    mentionFormatted: numberStr
  }
}

export function Phone_IsAMentionNumber(mentionStr: string) {
  return /^@\d{13}$/.test(mentionStr);
}

function Phone_IsValidNumberStr(numberStr: string): boolean {
  return Phone_MentionNumberRegex.test(numberStr) || Phone_UserIdRegex.test(numberStr);
}

