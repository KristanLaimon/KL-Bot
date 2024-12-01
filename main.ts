//Everything went right!
import { PrismaClient } from '@prisma/client';
const KlDb = new PrismaClient();
export default KlDb


import Bot from "./src/bot";
import ResponseCommand from './src/commands/test/response';
import SexoCommand from "./src/commands/test/sexo";
import TestCommand from './src/commands/test/test';
import HelpCommand from './src/commands/general/help';
import AgregarMiembroCommand from './src/commands/admin/agregarmiembro';
import ReceiveImgCommand from './src/commands/test/img';
import AddAdminCommand from './src/commands/test/admin_add';

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new ResponseCommand());
  klBot.AddCommand(new SexoCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new AgregarMiembroCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddAdminCommand());

  klBot.StartBot();
}

Main();
