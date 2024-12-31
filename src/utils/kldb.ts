//Expose main database
import { PrismaClient } from "@prisma/client";

const Kldb = new PrismaClient();

export default Kldb;