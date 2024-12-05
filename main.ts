import Bot from "./src/bot";
import WolfCommand from "./src/commands/test/wolf";
import HelpCommand from './src/commands/general/help';
import ReceiveImgCommand from './src/commands/test/img';
import AddMemberCommand from './src/commands/admin/addmember';
import DeleteAdmin from './src/commands/admin/deletemember';
import GetProfileInfoCommand from './src/commands/general/perfil';
import moment from 'moment';

async function Main() {
  //Set moment library to spanish
  moment.locale("es");

  const klBot = new Bot({ prefix: "!", coolDownTime: 1 });
  klBot.AddCommand(new WolfCommand());
  klBot.AddCommand(new HelpCommand());
  klBot.AddCommand(new ReceiveImgCommand());
  klBot.AddCommand(new AddMemberCommand());
  klBot.AddCommand(new DeleteAdmin());
  klBot.AddCommand(new GetProfileInfoCommand());

  klBot.StartBot();
}

Main();
