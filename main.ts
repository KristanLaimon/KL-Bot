import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
const sqlite = new Database('sqlite.db');
const KLDb = drizzle({ client: sqlite });
export default KLDb;
//Everything went right!

import Bot from "./src/bot";
import ResponseCommand from './src/commands/test/response';
import SexoCommand from "./src/commands/test/sexo";
import TestCommand from './src/commands/test/test';
import HelpCommand from './src/commands/general/help';
import AgregarMiembroCommand from './src/commands/admin/agregarmiembro';
import ReceiveImgCommand from './src/commands/test/img';
import AddAdminCommand from './src/commands/test/admin_add';
import { player } from './src/schema';

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new ResponseCommand());
  klBot.AddCommand(new SexoCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new AgregarMiembroCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddAdminCommand());

  try {
    await KLDb.insert(player).values({
      actualRank: "GC",
      phoneNumber: "asdfasdf",
      profilePicturePath: "asdfasdf",
      role: "AD",
      username: "Leon",
      whatsappNickName: "whatsappleonsito"
    })

  } catch (error) {
    console.log(error);
  }

  await klBot.StartBot();
}

Main();
