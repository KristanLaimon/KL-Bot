import { PrismaClient } from '@prisma/client';
import { PendingMatch } from '../types/db';



//Expose main database
const Kldb = new PrismaClient();
export default Kldb

//Expose temp PendingMatches mini db in memory
export const TempPendingMatches: PendingMatch[] = [];


