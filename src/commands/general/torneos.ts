import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import { Dates_GetFormatedDurationTimeFrom } from "../../utils/dates";
import { Db_FormatStrPlanningMatches, Db_GetTournamentFormattedInfoStr } from "../../utils/db";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import Kldb from "../../utils/kldb";

export default class SeeTournamentsCommand implements ICommand {
  commandName: string = "torneos";
  description: string = "Ver todos los torneos creados habidos y por haber con filtros";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo = {
    structure: "torneos",
    examples: [{ text: "torneos", isOk: true }, { text: "torneos someotherargument", isOk: false }],
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const allTournaments = await Kldb.tournament.findMany({
        include: {
          TournamentType: true,
        },
      });

      if (allTournaments.length === 0) {
        await chat.SendTxt("No hay torneos creados todavía...", true, { quoted: args.originalMsg });
        await chat.SendReactionToOriginalMsg("❌");
        return;
      }

      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        allTournaments,
        (_, index) => (index + 1).toString(),
        "====== 🏆 Torneos Creados 🏆 ======\n💡 Selecciona el torneo que deseas ver a detalle escogiendo su número",
        "🚫 Número inválido 🚫\nEse número no corresponde a ningún torneo. Por favor, selecciona un número válido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄\n\n",
        (tournament, index) => `
          ${index + 1}. 🏆 *${tournament.name}*  
            - 🎮 *Tipo:* ${tournament.TournamentType.name}  
            - 📅 *Creado hace:* ${Dates_GetFormatedDurationTimeFrom(tournament.creationDate, { includingSeconds: true })}
          `.trim(),
        60,
        {withDoubleSeparationOptions: true},
        { quoted: args.originalMsg}
      );
      let imgCaptionInfo = await Db_GetTournamentFormattedInfoStr(selectedTournament.id); //This text so far already is sanitized by Str_NormalizeLiteralString();
      if(selectedTournament.beginDate){
        imgCaptionInfo += '\n\nProgreso actual del torneo:\n\n';

        //This returns a not sanitized text,
        // due to the use of spaces to center this text
        imgCaptionInfo +=  await Db_FormatStrPlanningMatches(selectedTournament.id);
      }

      if (selectedTournament.cover_img_name) {
        await chat.SendImg(`db/tournaments_covers/${selectedTournament.cover_img_name}`, imgCaptionInfo, false);
      } else {
        await chat.SendTxt(imgCaptionInfo, false);
      }
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }

  }
}


