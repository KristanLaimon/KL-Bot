import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import Kldb, { TempPendingMatches } from '../../utils/db';
import { AllUtilsType } from '../../utils/index_utils';

export default class DuelWinCommand implements ICommand {
  commandName: string = "duelwin"
  description: string = "Para registrar un duelo pendiente realizado con !duel con otro miembro del clan"
  roleCommand: CommandAccessibleRoles = "Miembro"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    const t = utils.Msg.CreateSenderReplyToolKit(bot, args);

    //Check if sender is on a pending duel
    const numberSender = utils.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalPromptMsgObj)!.fullRawCleanedNumber;
    const pendingMatchFoundIndex = TempPendingMatches.findIndex(a => a.challenger.phoneNumber === numberSender || a.challenged.phoneNumber === numberSender);
    if (pendingMatchFoundIndex === -1) {
      t.txtToChatSender("❌ *No tienes un duelo pendiente con nadie.*\nPara iniciar uno, usa *!duel @persona* y retar a alguien");
      return;
    }

    //Check if theres the argument of scoreboard
    if (!/^\d{1,2}(\-|\||_)\d{1,2}$/.test(args.commandArgs.at(0) || "")) {
      t.txtToChatSender("⚠️ **Formato incorrecto del resultado.**\nRecuerda que el marcador debe ser en el formato adecuado. Ejemplo: **!duelwin 2-3** (con el **'-'** o **'|'** entre los números).\n❌ **Evita poner resultados como 100-12, ¡es imposible!** 🐺\nIntenta de nuevo.");
      return;
    }

    if (!/^(a|azul|n|naranja)$/.test(args.commandArgs.at(1) || '')) {
      t.txtToChatSender("⚠️ **Formato incorrecto de tu color de equipo.**\nPuede ser: *a* ó *azul* ó *n* ó *naranja*\nEjemplo: *!duelwin 2-3 n* (con el **'-'** o **'|'** entre los números y el equipo al final, separado por espacios).\n❌🐺\nIntenta de nuevo.");
      return;
    }

    const pendingMatch = TempPendingMatches.at(pendingMatchFoundIndex)!;
    //This is already handled so, lets remove his countdown
    clearTimeout(pendingMatch.countDownTimer);
    //Remove the pending match from the IN MEMORY LIST;
    TempPendingMatches.splice(pendingMatchFoundIndex, 1);

    //Two arguments: score and colorTeam given
    const score = args.commandArgs.at(0)!.split(/[-|_]/).map(scoreStr => parseInt(scoreStr));
    const winnerScore = Math.max(...score);
    const loserScore = Math.min(...score);
    let winnerTeamColor = args.commandArgs.at(1)!.toLowerCase();
    winnerTeamColor = winnerTeamColor === "a" || winnerTeamColor === "azul" ? "BLU" : "ORA";
    //TODO:Check which player is the winner and loser.... and store them in database

    try {
      t.txtToChatSender("Todo el proceso ocurrió exitosamente");
      //1. Store match in db
      await Kldb.match.create({
        data: {
          date_id: pendingMatch.dateTime,
          blue_scoreboard: winnerTeamColor === "BLU" ? winnerScore : loserScore,
          orange_scoreboard: winnerTeamColor === "ORA" ? winnerScore : loserScore,
          match_type: "1S"
        },
      })

      // //2. Store match_players
      // await Kldb.match_Player.createMany({
      //   data: [
      //     {
      //       player_id
      //     }
      //   ]
      // })
    } catch (e) {
      if (utils.Msg.isBotWaitMessageError(e)) {
      }
      else {
        t.txtToChatSender("Ha ocurrido algo raro " + JSON.stringify(e));
      }
    }
  }
}