import Bot from "../../bot";
import { SpecificChat } from "../../bot/SpecificChat";
import { BotCommandArgs } from "../../types/bot";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand } from "../../types/commands";
import { Dates_GetFormatedDurationTimeFrom } from "../../utils/dates";
import {
  Db_Info_Str_AllPhasePlanningMatches,
  Db_Info_Str_GeneralTournament,
  Db_Info_Str_TournamentParticipantTeams
} from "../../utils/db";
import { Msg_DefaultHandleError } from "../../utils/rawmsgs";
import Kldb from "../../utils/kldb";

export default class SeeTournamentsCommand implements ICommand {
  commandName: string = "torneos";
  description: string = "Ver todos los torneos creados habidos y por haber con filtros";
  scopes: CommandScopeType = "General";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  helpMessage?: CommandHelpInfo = {
    structure: "torneos",
    examples: [{ text: "torneos", isOk: true }, { text: "torneos someotherargument", isOk: false }],
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      await chat.SendReactionToOriginalMsg("⌛");
      const allTournaments = await Kldb.tournament.findMany({
        include: {
          TournamentType: true,
        },
      });

      if (allTournaments.length === 0) {
        await chat.SendText("No hay torneos creados todavía...", true, { quoted: args.originalMsg });
        await chat.SendReactionToOriginalMsg("❌");
        return;
      }
      let selectedTournament: { id: number; name: string; description: string; creationDate: bigint; beginDate: bigint; matchPeriodTime: number; endDate: bigint; cover_img_name: string; tournament_type: string; max_players: number; match_format: string; custom_players_per_team: number; };
      if(args.commandArgs.length === 1){
        const tryParseTournamentId = parseInt(args.commandArgs[0]);
        if(!isNaN(tryParseTournamentId)){
          selectedTournament = allTournaments.at(tryParseTournamentId - 1);
        }else{
          await chat.SendText("El argumento tiene que ser el número de torneo, si es que lo sabes de antemano", true, { quoted: args.originalMsg });
          await chat.SendReactionToOriginalMsg("❌");
          return;
        }
      }else{
        selectedTournament = await chat.DialogWaitAnOptionFromListObj(
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

      }

      const data =selectedTournament.beginDate ? await Db_Info_Str_AllPhasePlanningMatches(selectedTournament.id) : ""
      const teamsStr = await Db_Info_Str_TournamentParticipantTeams(selectedTournament.id);
      await chat.SendTournamentInfoFormatted(selectedTournament, (tournamentInfo) =>
        `${tournamentInfo}
        
        Equipos:
        
        ${teamsStr}
        
        ---- Progreso actual del torneo ----
        
        ${data}`,
        false);
      await chat.SendReactionToOriginalMsg("✅");
    } catch (e) {
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}


