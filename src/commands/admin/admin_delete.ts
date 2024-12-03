import Kldb from '../../../main';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot_utils';
import { CommandArgs, ICommand } from '../../types/bot_types';
import { CommandAccessibleRoles } from '../../types/helper_types';


export default class DeleteAdmin implements ICommand {
  commandName: string = 'admindelete';
  description: string = "deleteagimn"
  roleCommand: CommandAccessibleRoles;
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    const SendTxt = async (msg: string) => await bot.SendText(args.chatId, msg);
    await SendTxt("Borra el último!");
    const lastId = (await Kldb.player.findFirst({ orderBy: { id: "desc" }, select: { id: true } }))?.id;
    if (!lastId) {
      await SendTxt("No hay jugadores");
    }
    else {
      const playerDeleted = await Kldb.player.delete({ where: { id: lastId } });
      await SendTxt("Se ha borrado el usurio" + JSON.stringify(playerDeleted));
    }
  }
}