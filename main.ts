import Bot from "./src/bot";

import ResponseCommand from './src/commands/test/response';
import SexoCommand from "./src/commands/test/sexo";
import TestCommand from './src/commands/test/test';
import HelpCommand from './src/commands/general/help';

async function Main() {
  const klBot = new Bot({ prefix: "!", coolDownTime: 2 });
  klBot.AddCommand(new ResponseCommand());
  klBot.AddCommand(new SexoCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new HelpCommand());

  await klBot.StartBot();
}

Main();
