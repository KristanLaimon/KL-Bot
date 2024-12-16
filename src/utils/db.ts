import { PrismaClient } from '@prisma/client';
import { PendingMatch } from '../types/db';

//Expose main database
const Kldb = new PrismaClient();
export default Kldb

// ---------------- In RAM Db ------------------------
export const TempPendingMatches: PendingMatch[] = [];

// ------------------ Cache ------------------------
export let KldbCacheAllowedWhatsappGroups: NonNullable<Awaited<ReturnType<typeof Kldb.registeredWhatsappGroups.findFirst>>>[] = [];

export async function KldbUpdateCacheAsync() {
  KldbCacheAllowedWhatsappGroups = await Kldb.registeredWhatsappGroups.findMany();
}

