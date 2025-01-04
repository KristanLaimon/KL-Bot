import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandScopeType, ICommand } from "../../types/commands";
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../utils/rawmsgs";
import SpecificDialog from "../../bot/SpecificDialog";
import { KlTournament } from "../../types/db";
import { Phone_GetFullPhoneInfoFromRawMsg } from "../../utils/phonenumbers";

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  scopes: CommandScopeType[] = ["General", "UnregisteredGroup"]

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const dialog = new SpecificDialog(bot, args, { withNumeratedSteps: true});
    try {
      dialog.AddStep<void, {cancel:boolean, response:string}>("Ingresa cualquier cosa que quieras:", async (chat) => {
        const response = await chat.AskText(30);
        return {cancel:true, response};
      })

      dialog.AddStep<{cancel:boolean, reponse:string}, void>("Ahora dime otra cosa, cancelaré antes de que veas el 3er mensaje", async (chat, data, cancelDialog) => {
         const response = await chat.AskText(30);
         await chat.SendReactionToOriginalMsg("❌");
         cancelDialog();
      });

      dialog.AddStep("No deberías de ver este 3er paso!", async (chat) => {
        await chat.SendReactionToOriginalMsg("✅");
      });
      // const phoneInfo = Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)
      // await chat.SendText(`${phoneInfo.mentionFormatted} eres tú? 💖`, true, { quoted: args.originalMsg }, [phoneInfo.whatsappId]);
      // await chat.SendText(JSON.stringify(Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)));

      await dialog.StartConversation();
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}