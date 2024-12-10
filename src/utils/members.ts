import { Phone_GetPhoneNumberFromRawmsg } from './phonenumbers';
import { WAMessage } from '@whiskeysockets/baileys';
import { KlPlayer } from '../types/db';
import Kldb from './db';
import { HelperRoleName } from '../types/commands';

export async function Members_IsAdminSender(rawMsg: WAMessage): Promise<boolean> {
  let senderIsAnAdminAsWell: boolean = false;
  try {
    const phoneNumber = Phone_GetPhoneNumberFromRawmsg(rawMsg)!.fullRawCleanedNumber;
    senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
  } catch (e) {
    senderIsAnAdminAsWell = false;
  }
  return senderIsAnAdminAsWell;
}

export async function Members_GetMemberInfoFromPhone(cleanedPhoneNumber: string): Promise<KlPlayer | null> {
  let senderIsExpectedRoleType: KlPlayer | null;
  try {
    senderIsExpectedRoleType = await Kldb.player.findFirst({ where: { phoneNumber: cleanedPhoneNumber, role: "AD" } }) as KlPlayer;
  } catch (e) {
    senderIsExpectedRoleType = null;
  }
  return senderIsExpectedRoleType;
}