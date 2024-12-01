import { CommandAccessibleRoles, HelperRankId, HelperRankName, HelperRoleName } from '../../types/helper_types';
import Bot from '../../bot';
import { BotUtilsObj } from '../../bot_utils';
import { CommandArgs, ICommand, MsgType } from '../../types/bot_types';
import fs from 'fs'
import KlDb from '../../../main';
import path from 'path';

export default class AddAdminCommand implements ICommand {
  commandName: string = "addadmin";
  description: string = "Add an admin to the bot.... only the bot owner can do this so far";
  roleCommand: CommandAccessibleRoles = "Secreto";
  async onMsgReceived(bot: Bot, args: CommandArgs, utils: BotUtilsObj) {
    const SendText = (msg: string) => bot.SendText(args.chatId, msg);

    await bot.SendText(args.chatId, "You must give me the password to gain access to this high level command");
    const password = await bot.WaitTextMessageFrom(args.chatId, args.userId, 20);
    if (password != fs.readFileSync('db/secretpassword.txt').toString()) {
      await bot.SendText(args.chatId, "Wrong password...");
      return;
    }

    try {
      await bot.SendText(args.chatId, "Give me the new admin's name:");
      const name = await bot.WaitTextMessageFrom(args.chatId, args.userId);

      let validRank;
      do {
        await bot.SendText(args.chatId, "Give me his rank: \n You can use the following ranks:");
        await bot.SendText(args.chatId, "Bronce, Plata, Oro, Platino, Diamante, Campeón, Gran Campeón");
        const rankPrompt = await bot.WaitTextMessageFrom(args.chatId, args.userId, 60);
        validRank = await KlDb.rank.findFirst({ where: { id: rankPrompt } });
      } while (!validRank);

      SendText("Now send me his profile picture");
      let wasValidImg: boolean = false;
      let imgName: string;
      do {
        imgName = `AD-${name}-${Date.now()}-profile-picture`;
        wasValidImg = await utils.DownloadMedia(
          await bot.WaitMessageFrom(
            args.chatId,
            args.userId,
            MsgType.image, 60),
          imgName,
          ".png",
          "db/players"
        )

        if (!wasValidImg) {
          await bot.SendText(args.chatId, "Invalid image, try again...");
        } else
          SendText("Se ha recibido correctamente la imagen");
      } while (!wasValidImg);

      SendText("Now im trying to store everyint in my database");

      //Everything went right!
      await KlDb.player.create({
        data: {
          actualRank: (validRank as unknown as { id: HelperRankId }).id,
          phoneNumber: utils.GetPhoneNumber(args.originalPromptMsgObj).fullRawNumber,
          profilePicturePath: imgName,
          role: "AD",
          username: name,
          whatsappNickName: args.originalPromptMsgObj.pushName!,
        }
      })

      const m: string[] = [];
      m.push("------ A new admin has been added with the following: --------")
      m.push(`Username: ${name}`)
      m.push(`Role: Administrator | AD`);
      m.push(`Rango: ${validRank!.name}`)
      m.push(`ProfileImage:`);
      await bot.SendText(args.chatId, m.join("\n"));
      await bot.SendImg(args.chatId, path.join("db", imgName, ".png"));

      await bot.SendText(args.chatId, "============================");
    } catch (error) {
      SendText(error);
    }
  }
}