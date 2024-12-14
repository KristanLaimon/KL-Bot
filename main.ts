import Bot from "./src/bot";
import moment from 'moment';
import WolfCommand from "./src/commands/testing/wolf";
import HelpCommand from './src/commands/general/help';
import ReceiveImgCommand from './src/commands/testing/img';
import AddMemberCommand from './src/commands/admin/addmember';
import DeleteAdmin from './src/commands/admin/deletemember';
import GetProfileInfoCommand from './src/commands/general/perfil';
import TestCommand from './src/commands/testing/prueba';
import OtherCommand from './src/commands/testing/other';
import DuelCommand from './src/commands/general/duel';
import DuelWinCommand from './src/commands/general/duelwin';
import SeeMembersCommand from './src/commands/general/members';

//For some reason this bot stops working if a group has ( or ) in its name on production server ubuntu server!

export function Main() {
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
  klBot.AddCommand(new SeeMembersCommand());

  klBot.StartBot();
  return klBot;
}

Main();