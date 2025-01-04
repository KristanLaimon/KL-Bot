import Bot from '../../bot';
import GlobalCache from '../../bot/cache/GlobalCache';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand, CommandScopeType, CommandHelpInfo } from '../../types/commands';
import { Phone_GetFullPhoneInfoFromRawMsg } from '../../utils/phonenumbers';
import { Msg_DefaultHandleError, Msg_IsBotWaitMessageError } from "../../utils/rawmsgs";
import Kldb from "../../utils/kldb";

export default class DuelWinCommand implements ICommand {
  commandName: string = "duelwin"
  description: string = "Para registrar un duelo pendiente realizado con !duel con otro miembro del clan"
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro"
  scopes: CommandScopeType = "General"
  helpMessage?: CommandHelpInfo = {
    structure: "duelwin [@etiquetadealgunmiembro] [marcador] [equipo]\nMarcador: 0-0 | 1-3 | 10-3 | 2-0 | 9-0 | etc...\nEquipo: naranja | n | azul | a",
    examples: [
      { text: "duelwin @alguien 2-3 naranja", isOk: true },
      { text: "duelwin @alguien 1-0 azul", isOk: true },
      { text: "duelwin @alguien 0-1 n", isOk: true },
      { text: "duelwin @alguien 1-0 a", isOk: true },
      { text: "duelwin", isOk: false },
      { text: "duelwin @alguien 2- naranja", isOk: false },
      { text: "duelwin @alguien naranja", isOk: false },
      { text: "duelwin 2-3 naranja", isOk: false },
      { text: "duelwin @alguien 2-3", isOk: false }
    ],
    notes: "No puedes poner un score de 100-8 por ejemplo (con 100) ni tampoco empate, no es posible empates en rl sideswipe."
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    //Check if sender is on a pending duel
    const whatsIdSender = Phone_GetFullPhoneInfoFromRawMsg(args.originalMsg)!.whatsappId;
    const pendingMatchFoundIndex = GlobalCache.Auto_PendingMatches.findIndex(a => a.challenger.whatsapp_id === whatsIdSender || a.challenged.whatsapp_id === whatsIdSender);
    if (pendingMatchFoundIndex === -1) {
      await chat.SendText("❌ *No tienes un duelo pendiente con nadie.*\nPara iniciar uno, usa *!duel @persona* y retar a alguien", true, {quoted: args.originalMsg});
      return;
    }

    //Check if theres the argument of scoreboard
    if (!/^\d{1,2}(\-|\||_)\d{1,2}$/.test(args.commandArgs.at(0) || "")) {
      await chat.SendText("⚠️ *Formato incorrecto del resultado.*\nRecuerda que el marcador debe ser en el formato adecuado. \nEjemplo: *!duelwin 2-3 (azul ó naranja ó a ó n)* (con el *'-'* o *'|'* entre los números).\n❌ *Evita poner resultados como 100-12, ¡es imposible!* 🐺\nIntenta de nuevo.", true, {quoted: args.originalMsg});
      return;
    }

    if (!/^(a|azul|n|naranja)$/.test(args.commandArgs.at(1) || '')) {
      await chat.SendText("⚠️ *Formato incorrecto de tu color de equipo.*\nPuede ser: *a* ó *azul* ó *n* ó *naranja*\nEjemplo: *!duelwin 2-3 n* (con el *'-'** o *'|'* entre los números y el equipo al final, separado por espacios).\n❌🐺\nIntenta de nuevo.", true, {quoted: args.originalMsg});
      return;
    }

    const pendingMatch = GlobalCache.Auto_PendingMatches.at(pendingMatchFoundIndex)!;

    //Two arguments: score and colorTeam given
    const score = args.commandArgs.at(0)!.split(/[-|_]/).map(scoreStr => parseInt(scoreStr));
    const winnerScore = Math.max(...score);
    const loserScore = Math.min(...score);

    if (winnerScore === loserScore) {
      await chat.SendText("Empate?, eso no es posible, probablemente te equivocaste al poner la puntuación, intenta de nuevo", true, {quoted: args.originalMsg});
      return;
    }

    let winnerTeamColor = args.commandArgs.at(1)!.toLowerCase();
    winnerTeamColor = winnerTeamColor === "a" || winnerTeamColor === "azul" ? "BLU" : "ORA";
    const winnerPlayer = pendingMatch.challenger.whatsapp_id === whatsIdSender ? pendingMatch.challenger : pendingMatch.challenged;
    const loserPlayer = !(pendingMatch.challenger.whatsapp_id == whatsIdSender) ? pendingMatch.challenger : pendingMatch.challenged;

    //This is already handled so, lets remove his countdown
    clearTimeout(pendingMatch.countDownTimer);
    //Remove the pending match from the IN MEMORY LIST;
    GlobalCache.Auto_PendingMatches.splice(pendingMatchFoundIndex, 1);

    try {
      await chat.SendText("Todo el proceso ocurrió exitosamente");
      //1. Store match in db
      await Kldb.matchPlayed.create({
        data: {
          date_played: pendingMatch.dateTime,
          blue_scoreboard: winnerTeamColor === "BLU" ? winnerScore : loserScore,
          orange_scoreboard: !(winnerTeamColor === "BLU") ? winnerScore : loserScore,
          match_type: "1S"
        },
      })

      //2. Store match_players
      await Kldb.matchPlayed_Player.createMany({
        data: [
          {
            player_id: winnerPlayer.id,
            is_winner: true,
            match_played_date_id: pendingMatch.dateTime,
            team_color_winner: winnerTeamColor === "BLU" ? "BLU" : "ORA"
          },
          {
            player_id: loserPlayer.id,
            is_winner: false,
            match_played_date_id: pendingMatch.dateTime,
            team_color_winner: !(winnerTeamColor === "BLU") ? "BLU" : "ORA"
          }
        ]
      })

      chat.SendText(`
        🎮 **Resultado del duelo:**

        - **Puntuación:** ${score[0]}-${score[1]}.
        - 🏆 **Ganador:** **${winnerPlayer.username}** (Equipo **${winnerTeamColor === "BLU" ? "Azul" : "Naranja"}**).

        🔄 Los resultados se han registrado.
      `);
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}