import { GetPhoneNumberFromRawmsg } from './phonenumbers';
import { WAMessage } from '@whiskeysockets/baileys';
import { KlPlayer } from '../types/db';
import Kldb from './db';
import { HelperRoleName } from '../types/commands';

export async function isAdminSender(rawMsg: WAMessage): Promise<boolean> {
  let senderIsAnAdminAsWell: boolean = false;
  try {
    const phoneNumber = GetPhoneNumberFromRawmsg(rawMsg)!.fullRawCleanedNumber;
    senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
  } catch (e) {
    senderIsAnAdminAsWell = false;
  }
  return senderIsAnAdminAsWell;
}

export async function GetMemberInfoFromPhone(cleanedPhoneNumber: string, roleType: HelperRoleName): Promise<KlPlayer | null> {
  let senderIsExpectedRoleType: KlPlayer | null;
  try {
    switch (roleType) {
      case "Administrador":
        senderIsExpectedRoleType = await Kldb.player.findFirst({ where: { phoneNumber: cleanedPhoneNumber, role: "AD" } });
        break;
      case "Miembro":
        senderIsExpectedRoleType = await Kldb.player.findFirst({ where: { phoneNumber: cleanedPhoneNumber } });
        break;
    }
  } catch (e) {
    senderIsExpectedRoleType = null;
  }
  return senderIsExpectedRoleType;
}