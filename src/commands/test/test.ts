import { WAMessage } from '@whiskeysockets/baileys';
import Bot from '../../bot';
import { CommandArgs, ICommand, MsgType, SenderType } from '../../typos';
import fs from "fs";
import RanksImgPaths from '../../types/ranks';

export default class TestCommand implements ICommand {
  commandName: string = 'rango';
  description: string = 'Por el momento solo manda una imagen del rango que tu le pidas'
  async onMsgReceived(bot: Bot, args: CommandArgs) {
    if (args.commandArgs.length != 1) {
      await bot.SendText(args.chatSenderId, "Tienes que mandar de que rango quieres la imagen");
      return;
    }

    const rank = args.commandArgs[0].toLocaleLowerCase().replace('ó', "o");
    const rankPath = RanksImgPaths[rank];

    if (!rankPath) {
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

      await bot.SendText(args.chatSenderId, strs.join('\n'));
      return;
    }

    await bot.SendObjMsg(args.chatSenderId, {image: fs.readFileSync(rankPath), caption: "LoboKL"}); 
  }
}