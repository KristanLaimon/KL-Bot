import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandScopeType, ICommand } from "../../types/commands";
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../utils/rawmsgs";
import SpecificDialog from "../../bot/SpecificDialog";
import { KlTournament } from "../../types/db";

export default class TestCommand implements ICommand {
  commandName: string = "test";
  description: string = "A simple test command";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador"
  maxScope: CommandScopeType = "Group"

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const d = new SpecificDialog(bot, args, { withNumeratedSteps: true });
    const armable: Partial<KlTournament> = {}

    d.AddStep<void, boolean>("Hola, espero que me respondas con un hola también ", async (chat)  => {
      const response = await chat.AskText(60);
      armable.custom_players_per_team = 3;
      return response.includes("hola");
    })

    d.AddStep<boolean, boolean>('Ahora toca checar si me dijiste hola', async (chat, wasHola) => {
      const toSend = wasHola ? "Si!!" : "No..";
      armable.matchPeriodTime = 3;
      chat.SendTxt(toSend);

      return wasHola;
    } )

    try {
    const finalResult = await d.StartConversation<boolean>();
    const result = 3;

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}