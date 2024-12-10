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
    const numberSender = utils.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalMsg)!.fullRawCleanedNumber;
    const pendingMatchFoundIndex = TempPendingMatches.findIndex(a => a.challenger.phoneNumber === numberSender || a.challenged.phoneNumber === numberSender);
    if (pendingMatchFoundIndex === -1) {
      await t.txtToChatSender("❌ *No tienes un duelo pendiente con nadie.*\nPara iniciar uno, usa *!duel @persona* y retar a alguien");
      return;
    }

    //Check if theres the argument of scoreboard
    if (!/^\d{1,2}(\-|\||_)\d{1,2}$/.test(args.commandArgs.at(0) || "")) {
      await t.txtToChatSender("⚠️ *Formato incorrecto del resultado.*\nRecuerda que el marcador debe ser en el formato adecuado. \nEjemplo: *!duelwin 2-3 (azul ó naranja ó a ó n)* (con el *'-'* o *'|'* entre los números).\n❌ *Evita poner resultados como 100-12, ¡es imposible!* 🐺\nIntenta de nuevo.");
      return;
    }

    if (!/^(a|azul|n|naranja)$/.test(args.commandArgs.at(1) || '')) {
      await t.txtToChatSender("⚠️ *Formato incorrecto de tu color de equipo.*\nPuede ser: *a* ó *azul* ó *n* ó *naranja*\nEjemplo: *!duelwin 2-3 n* (con el *'-'** o *'|'* entre los números y el equipo al final, separado por espacios).\n❌🐺\nIntenta de nuevo.");
      return;
    }

    const pendingMatch = TempPendingMatches.at(pendingMatchFoundIndex)!;

    //Two arguments: score and colorTeam given
    const score = args.commandArgs.at(0)!.split(/[-|_]/).map(scoreStr => parseInt(scoreStr));
    const winnerScore = Math.max(...score);
    const loserScore = Math.min(...score);

    if (winnerScore === loserScore) {
      await t.txtToChatSender("Empate?, eso no es posible, probablemente te equivocaste al poner la puntuación, intenta de nuevo");
      return;
    }

    let winnerTeamColor = args.commandArgs.at(1)!.toLowerCase();
    winnerTeamColor = winnerTeamColor === "a" || winnerTeamColor === "azul" ? "BLU" : "ORA";
    const winnerPlayer = pendingMatch.challenger.phoneNumber === numberSender ? pendingMatch.challenger : pendingMatch.challenged;
    const loserPlayer = !(pendingMatch.challenger.phoneNumber == numberSender) ? pendingMatch.challenger : pendingMatch.challenged;

    //This is already handled so, lets remove his countdown
    clearTimeout(pendingMatch.countDownTimer);
    //Remove the pending match from the IN MEMORY LIST;
    TempPendingMatches.splice(pendingMatchFoundIndex, 1);

    try {
      await t.txtToChatSender("Todo el proceso ocurrió exitosamente");
      //1. Store match in db
      await Kldb.match.create({
        data: {
          date_id: pendingMatch.dateTime,
          blue_scoreboard: winnerTeamColor === "BLU" ? winnerScore : loserScore,
          orange_scoreboard: !(winnerTeamColor === "BLU") ? winnerScore : loserScore,
          match_type: "1S"
        },
      })

      //2. Store match_players
      await Kldb.match_Player.createMany({
        data: [
          {
            player_id: winnerPlayer.id,
            is_winner: true,
            match_date_id: pendingMatch.dateTime,
            team_color: winnerTeamColor === "BLU" ? "BLU" : "ORA"
          },
          {
            player_id: loserPlayer.id,
            is_winner: false,
            match_date_id: pendingMatch.dateTime,
            team_color: !(winnerTeamColor === "BLU") ? "BLU" : "ORA"
          }
        ]
      })

      t.txtToChatSender(`
        🎮 **Resultado del duelo:**

        - **Puntuación:** ${score[0]}-${score[1]}.
        - 🏆 **Ganador:** **${winnerPlayer.username}** (Equipo **${winnerTeamColor === "BLU" ? "Azul" : "Naranja"}**).

        🔄 Los resultados se han registrado.
      `);

    } catch (e) {
      if (utils.Msg.isBotWaitMessageError(e)) {
      }
      else {
        t.txtToChatSender("Ha ocurrido algo raro, y no se ha guardado la información del duelo " + JSON.stringify(e));
      }
    }
  }
}