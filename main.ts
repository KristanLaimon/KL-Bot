import { PrismaClient } from '@prisma/client';
const Kldb = new PrismaClient();
export default Kldb

import Bot from "./src/bot";
import WolfCommand from "./src/commands/test/wolf";
import HelpCommand from './src/commands/general/help';
import ReceiveImgCommand from './src/commands/test/img';
import AddAdminCommand from './src/commands/admin/admin_post';
import DeleteAdmin from './src/commands/admin/admin_delete';

import { PlayerImage } from './src/imgDb';

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new WolfCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddAdminCommand());
  klBot.AddCommand(new DeleteAdmin());

  klBot.StartBot();
}

Main();
