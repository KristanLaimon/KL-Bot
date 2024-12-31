import { Phone_GetFullPhoneInfoFromRawmsg } from './phonenumbers';
import { WAMessage } from '@whiskeysockets/baileys';
import Kldb from "./kldb";

/**
 * Checks if the sender of the given raw message is an admin in the KLBOT system.
 *
 * @param rawMsg - The raw message to extract the sender's phone number from.
 * @returns A promise that resolves to a boolean indicating whether the sender is an admin.
 *
 * @remarks
 * This function retrieves the sender's phone number from the raw message,
 * then checks if a player with the same phone number and the role "AD" (admin) exists in the database.
 * If such a player is found, the function resolves to `true`; otherwise, it resolves to `false`.
 * If an error occurs during the process, the function resolves to `false`.
 */
export async function Members_IsAdminSender(rawMsg: WAMessage): Promise<boolean> {
  let senderIsAnAdminAsWell: boolean;
  try {
    const phoneNumber = Phone_GetFullPhoneInfoFromRawmsg(rawMsg)!.number;
    senderIsAnAdminAsWell = !!(await Kldb.player.findFirst({ where: { phoneNumber, role: "AD" } }));
  } catch (e) {
    senderIsAnAdminAsWell = false;
  }
  return senderIsAnAdminAsWell;
}


/**
 * Retrieves member information from the database based on the provided phone number.
 *
 * @param cleanedPhoneNumber - The cleaned phone number to search for in the database.
 * @returns A promise that resolves to the member information if found, or `null` if not found.
 *
 * @remarks
 * This function attempts to find a player in the database with the given `cleanedPhoneNumber`.
 * If a player is found, the function includes the associated `Rank` and `Role` entities in the result.
 * If no player is found, the function resolves to `null`.
 * If an error occurs during the database query, the function resolves to `null`.
 */
export async function Members_GetMemberInfoFromPhone(cleanedPhoneNumber: string) {
  try {
    return await Kldb.player.findFirst({ where: { phoneNumber: cleanedPhoneNumber }, include: { Rank: true, Role: true } });
  } catch (e) {
    return null
  }
}

