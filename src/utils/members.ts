import { Phone_GetFullPhoneInfoFromRawmsg } from './phonenumbers';
import { WAMessage } from '@whiskeysockets/baileys';
import { KlPlayer } from '../types/db';
import Kldb from './db';
import { HelperRoleName } from '../types/commands';

export async function Members_IsAdminSender(rawMsg: WAMessage): Promise<boolean> {
  let senderIsAnAdminAsWell: boolean = false;
  try {
    const phoneNumber = Phone_GetFullPhoneInfoFromRawmsg(rawMsg)!.number;
    senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
  } catch (e) {
    senderIsAnAdminAsWell = false;
  }
  return senderIsAnAdminAsWell;
}

export async function Members_GetMemberInfoFromPhone(cleanedPhoneNumber: string) {
  try {
    return await Kldb.player.findFirst({ where: { phoneNumber: cleanedPhoneNumber }, include: { Rank: true, Role: true } });
  } catch (e) {
    return null
  }
}