import moment from 'moment';
import Bot from "./src/bot";
import UnsubscribeGroupCommand from './src/commands/admin/groups/desuscribirgrupo';
import SubscribeGroupCommand from './src/commands/admin/groups/suscribirgrupo';
import SeeGroupsSubscribedCommand from './src/commands/admin/groups/suscripciones';
import AddMemberCommand from './src/commands/admin/members/añadirmiembro';
import DeleteAdmin from './src/commands/admin/members/borrarmiembro';
import CreateTournamentCommand from './src/commands/admin/tournaments/creartorneo';
import ExternalHelp_AyudaCommand from './src/commands/ayuda';
import DuelCommand from './src/commands/general/duel';
import DuelWinCommand from './src/commands/general/duelwin';
import HelpCommand from './src/commands/general/help';
import VerMiembrosCommand from './src/commands/general/miembros';
import GetProfileInfoCommand from './src/commands/general/perfil';
import TestCommand from './src/commands/testing/prueba';
import SeeTournamentsCommand from './src/commands/general/torneos';
import DeleteTournamentCommand from './src/commands/admin/tournaments/borrartorneo';

//For some reason this bot stops working if a group has ( or ) in its name on production server ubuntu server!

//Set moment library to spanish
moment.locale("es");

const klBot = new Bot({ prefix: "!", coolDownSecondsTime: 1, maxQueueMsgs: 5 });

klBot.AddCommand(new HelpCommand());
klBot.AddCommand(new AddMemberCommand());
klBot.AddCommand(new DeleteAdmin());
klBot.AddCommand(new GetProfileInfoCommand());
klBot.AddCommand(new TestCommand());
klBot.AddCommand(new DuelCommand());
klBot.AddCommand(new DuelWinCommand());
klBot.AddCommand(new VerMiembrosCommand());
klBot.AddCommand(new SubscribeGroupCommand());
klBot.AddCommand(new SeeGroupsSubscribedCommand());
klBot.AddCommand(new UnsubscribeGroupCommand());
klBot.AddCommand(new ExternalHelp_AyudaCommand());
klBot.AddCommand(new CreateTournamentCommand());
klBot.AddCommand(new SeeTournamentsCommand());
klBot.AddCommand(new DeleteTournamentCommand());

klBot.StartBot();
