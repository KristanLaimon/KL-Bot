import Bot from '../../bot';
import { BotCommandArgs } from '../../types/bot';
import { CommandAccessibleRoles, ICommand } from '../../types/commands';
import { TempPendingMatches } from '../../utils/db';
import { AllUtilsType } from '../../utils/index_utils';

export default class DuelWinCommand implements ICommand {
  commandName: string = "duelwin"
  description: string = "Para registrar un duelo pendiente realizado con !duel con otro miembro del clan"
  roleCommand: CommandAccessibleRoles = "Miembro"
  async onMsgReceived(bot: Bot, args: BotCommandArgs, utils: AllUtilsType) {
    const t = utils.Msg.CreateSenderReplyToolKit(bot, args);

    //Check if sender is on a pending duel
    const numberSender = utils.PhoneNumber.GetPhoneNumberFromRawmsg(args.originalPromptMsgObj)!.fullRawCleanedNumber;
    const thisSenderIsOnPendingMatchObj = TempPendingMatches.find(a => a.challenger.phoneNumber === numberSender || a.challenged.phoneNumber === numberSender);
    if (!thisSenderIsOnPendingMatchObj) {
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

    //Two arguments: score and colorTeam given

    try {
      t.txtToChatSender("Todo el proceso ocurrió exitosamente, falta implementar la lógica para guardar en la base de datos");
    } catch (e) {
      if (utils.Msg.isBotWaitMessageError(e)) {
      }
      else {
        t.txtToChatSender("Ha ocurrido algo raro " + JSON.stringify(e));
      }
    }
  }
}