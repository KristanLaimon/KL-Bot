import fs from "fs";
import Bot from '../../bot';

import { CommandArgs, ICommand } from '../../types/bot_types';
import { HelperRankName, HelperRoleName } from '../../types/helper_types';
import KLDb from '../../../main';



export default class TestCommand implements ICommand {
  commandName: string = 'rango';
  roleCommand: HelperRoleName = "Miembro";
  description: string = 'Por el momento solo manda una imagen del rango que tu le pidas'
  async onMsgReceived(bot: Bot, args: CommandArgs) {
    if (args.commandArgs.length != 1) {
      await bot.SendText(args.chatId, "Tienes que mandar de que rango quieres la imagen, solo se manda una palabra");
      return;
    }

    const selectdRank = CapitalizeStr(args.commandArgs[0]);
    const rankObj = await KLDb.select().from(rank).where(eq(rank.name, selectdRank as HelperRankName)).get();

    if (!rankObj) {
      const strs: string[] = [];

      strs.push('No existe ese rango, prueba con algunos de los siguientes:');
      strs.push('Bronce');
      strs.push('Plata');
      strs.push('Oro');
      strs.push('Platino');
      strs.push('Diamante');
      strs.push('Campeón');
      strs.push('gc');

      strs.push('');
      strs.push('Ejemplo de uso: !rango campeón   ó    !rango campeon');

      await bot.SendText(args.chatId, strs.join('\n'));
      return;
    }

    await bot.SendObjMsg(args.chatId, { image: fs.readFileSync(rankObj.logoImagePath), caption: "LoboKL" });
  }
}

function CapitalizeStr(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}