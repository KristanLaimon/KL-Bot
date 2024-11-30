import Bot from "./src/bot";

import ResponseCommand from './src/commands/test/response';
import SexoCommand from "./src/commands/test/sexo";
import TestCommand from './src/commands/test/test';
import HelpCommand from './src/commands/general/help';
import AgregarMiembroCommand from './src/commands/admin/AgregarJugador';

import { drizzle } from "drizzle-orm/libsql";
import { player } from "./drizzle/schema"
import { eq } from 'drizzle-orm';
const db = drizzle("file:./db/klbotdb.db");

async function DbTest() {
  const deletedPlayer = await db
    .delete(player)
    .where(eq(player.username, "Kristansito"))
    .returning();
}

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new ResponseCommand());
  klBot.AddCommand(new SexoCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new AgregarMiembroCommand());

  await klBot.StartBot();
}

DbTest();
Main();
