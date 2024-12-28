import Bot from '../../bot';
import { SpecificChat } from '../../bot/SpecificChat';
import { BotCommandArgs } from '../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, CommandHelpInfo } from '../../types/commands';
import { Dates_GetFormatedDurationTimeFrom } from '../../utils/dates';
import Kldb from '../../utils/db';
import { Msg_DefaultHandleError } from '../../utils/rawmsgs';
import { Str_NormalizeLiteralString } from '../../utils/strings';

export default class c implements ICommand {
  commandName: string = "entrartorneo";
  description: string = "Te permite entrar en algun torneo que esté abierto actualmente";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Miembro";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    try {
      const activeTournaments = await Kldb.tournament.findMany({
        where: {
          beginDate: {
            gte: Date.now()
          }
        },
        include: {
          Tournament_Player_Subscriptions: {
            include: {
              Player: {
                include: { Rank: true, Role: true }
              }
            },
            orderBy: {
              Player: { username: "asc" }
            }
          },
          TournamentType: true,
          Tournament_Rank_RanksAdmitted: {
            include: { Rank: true },
            orderBy: { Rank: { id: "asc" } }
          }
        }
      });

      if (activeTournaments.length === 0) {
        await chat.SendTxt("No hay ningun torneo activo por el momento, intentalo después...");
        return;
      }

      let startMsg = `
        ==== 🏆 Torneos Activos para participar🏆 ====
        Elige el número del torneo al cual desees participar:
      `;
      startMsg = Str_NormalizeLiteralString(startMsg);

      let errorMsg = `
        🚫 Número inválido 🚫
         Ese número no corresponde a ningun torneo activo. Por favor, selecciona un número valido de la lista ('1', '2', etc). ¡Inténtalo de nuevo! 🔄
      `;
      errorMsg = Str_NormalizeLiteralString(errorMsg);

      const selectedTournament = await chat.DialogWaitAnOptionFromListObj(
        activeTournaments,
        (tournament, index) => (index + 1).toString(),
        startMsg,
        errorMsg,
        (tournament, index) => {

          return `
            // * ${tournament.name} - ${tournament.TournamentType.name}

            // * Fecha de inicio: ${Dates_GetFormatedDurationTimeFrom(tournament.beginDate)}
            // * Rangos admitidos: ${tournament.Tournament_Rank_RanksAdmitted.map(rank => rank.Rank.name).join(", ")}

          `;
        },
        60
      );

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}

