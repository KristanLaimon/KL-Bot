import Bot from "./src/bot";
import moment from 'moment';
import WolfCommand from "./src/commands/test/wolf";
import HelpCommand from './src/commands/general/help';
import ReceiveImgCommand from './src/commands/test/img';
import AddMemberCommand from './src/commands/admin/addmember';
import DeleteAdmin from './src/commands/admin/deletemember';
import GetProfileInfoCommand from './src/commands/general/perfil';
import TestCommand from './src/commands/test/test';
import OtherCommand from './src/commands/test/other';
import DuelCommand from './src/commands/general/duel';
import DuelWinCommand from './src/commands/general/duelwin';

//For some reason this bot stops working if a group has ( or ) in its name on production server ubuntu server!

async function Main() {
  //Set moment library to spanish
  moment.locale("es");

  const klBot = new Bot({ prefix: "!", coolDownSecondsTime: 1 });
  klBot.AddCommand(new WolfCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddMemberCommand());
  klBot.AddCommand(new DeleteAdmin());
  klBot.AddCommand(new GetProfileInfoCommand());
  klBot.AddCommand(new TestCommand());
  klBot.AddCommand(new OtherCommand());
  klBot.AddCommand(new DuelCommand());
  klBot.AddCommand(new DuelWinCommand());

  klBot.StartBot();
}

Main();