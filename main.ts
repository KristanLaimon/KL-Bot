import { PrismaClient } from '@prisma/client';
const Kldb = new PrismaClient();
export default Kldb

import Bot from "./src/bot";
import ResponseCommand from './src/commands/test/response_get';
import WolfCommand from "./src/commands/test/example_get";
import TestCommand from './src/commands/test/test_get';
import HelpCommand from './src/commands/general/help';
import AgregarMiembroCommand from './src/commands/test/member_post';
import ReceiveImgCommand from './src/commands/test/img_get';
import AddAdminCommand from './src/commands/test/admin_post';

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new ResponseCommand());
  klBot.AddCommand(new WolfCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new AgregarMiembroCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddAdminCommand());

  klBot.StartBot();
}

Main();
