import fs from "fs";
import Bot from "../../../bot";
import KlLogger from "../../../bot/logger";
import { SpecificChat } from "../../../bot/SpecificChat";
import { BotCommandArgs } from "../../../types/bot";
import { CommandAccessibleRoles, CommandHelpInfo, CommandScopeType, ICommand, MsgType } from "../../../types/commands";
import { KlMatchType, KlTournament } from "../../../types/db";
import Kldb from "../../../utils/db";
import { GenerateInstructionSteps } from "../../../utils/dialog";
import { Db_TryToDownloadMedia } from "../../../utils/filesystem";
import { Msg_DefaultHandleError } from "../../../utils/rawmsgs";
import { Response_isAfirmativeAnswer } from "../../../utils/responses";
import SpecificDialog from "../../../bot/SpecificDialog";
import { Str_StringifyObj } from "../../../utils/strings";

export default class CreateTournamentCommand implements ICommand {
  commandName: string = "creartorneo";
  description: string = "Crea un nuevo torneo en el servidor. Incluye opciones para especificar el nombre del torneo, descripción, fecha de inicio, ventana de juego, y rangos de participantes.";
  maxScope: CommandScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  helpMessage: CommandHelpInfo = {
    structure: "creartorneo",
    examples: [
      { text: "creartorneo", isOk: true },
      { text: "creartorneo algunaotracosa", isOk: false }
    ]
  }

  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);
    const dialog = new SpecificDialog(bot, args, { withNumeratedSteps: true});
    const OUTSIDE_DefaultTimeout = 250
    const OUTSIDE_SelectedRanks: Awaited<ReturnType<typeof Kldb.rank.findMany>> = [];
    let   OUTSIDE_storedImg: string | null = null;
    const TOURNAMENTFINAL: Partial<KlTournament> = {};

    await chat.SendTxt(`====== Creación de un torneo =====`);

    dialog.AddStep("Ingresa el tipo de torneo", async (chat) => {
      const _typesAvailable = await Kldb.tournamentType.findMany();
      const _typeSelected = await chat.DialogWaitAnOptionFromListObj(
        _typesAvailable,
        (info, index) => (index + 1).toString(),
        "Lista de tipos de torneos disponibles:",
        "Ese tipo no existe, selecciona el número de la lista, e.g: '1' para eliminación simple, prueba de nuevo:",
        (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
        OUTSIDE_DefaultTimeout
      );
      TOURNAMENTFINAL.tournament_type = _typeSelected.id;
    })

    dialog.AddStep("Ingresa el nombre del torneo", async (chat) => {
      const allExistingTournamentNames = (await Kldb.tournament.findMany({select: { name: true}}))
      let name:string = "Sin nombre";

      while(true){
        name = await chat.AskText(OUTSIDE_DefaultTimeout);
        if(!allExistingTournamentNames.some((existingTournament) => existingTournament.name.toLowerCase() === name.toLowerCase())) {
          break;
        }else{
          await chat.SendTxt("Ya existe un torneo con ese nombre, prueba de nuevo");
        }
      }

      TOURNAMENTFINAL.name = name;
    })

    dialog.AddStep("Ingresa la descripción del torneo", async (chat) => {
      TOURNAMENTFINAL.description = await chat.AskText(OUTSIDE_DefaultTimeout);
    })

    dialog.AddStep<void, {isCustom:boolean, gameTypeSelectedObj:KlMatchType} >("Ingresa el modo de juego que tendrá el torneo", async (chat) => {
      const _allGameTypes = await Kldb.matchType.findMany({ orderBy: { id: "asc" } });
      const _gameTypeSelected = await chat.DialogWaitAnOptionFromListObj(
        _allGameTypes,
        (info, index) => (index + 1).toString(),
        "Lista de tipos de partidas disponibles:",
        "Ese tipo no existe, selecciona el número de la lista, e.g: '1' para 1vs1, prueba de nuevo:",
        (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
        OUTSIDE_DefaultTimeout
      );

      //Is custom game
      if (_gameTypeSelected.id === "CU") {
        const __allGameTypesExceptSomeOnes = await Kldb.matchType.findMany({ where: { NOT: { id: { in: ["1S", "2S", "3S"] } } }, orderBy: { id: "asc" } });
        const __gameTypeSelectedAgain = await chat.DialogWaitAnOptionFromListObj(
          __allGameTypesExceptSomeOnes,
          (info, index) => (index + 1).toString(),
          "== CUSTOM ==\nLista de tipos de partidas personalizadas disponibles:",
          "Ese tipo no existe, selecciona el número de la lista, e.g: '1' ó '2', prueba de nuevo:",
          (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
          OUTSIDE_DefaultTimeout
        );
        _gameTypeSelected.id = __gameTypeSelectedAgain.id

        await chat.SendTxt(`Has elegido ${__gameTypeSelectedAgain.name}, indica el número de jugadores por equipo personalizado: (Ejemplo: '2' para 2 jugadores por equipo)`);
        const _customMaxPlayersPerTeam = await chat.AskForSpecificText(
          /^\d{1}$/,
          "No has ingresado un número valido, recuerda que el formato debe ser un 'número de jugadores', por ejemplo: '2' pero no más de '10', prueba de nuevo: ",
          OUTSIDE_DefaultTimeout
        );
        TOURNAMENTFINAL.custom_players_per_team = parseInt(_customMaxPlayersPerTeam);
      }
      TOURNAMENTFINAL.match_format = _gameTypeSelected.id;
      return {
        isCustom: TOURNAMENTFINAL.custom_players_per_team !== -1, //Return if its custom. -1 (No custom) and any other value make this custom
        gameTypeSelectedObj: _gameTypeSelected
      }
    })

    dialog.AddStep<{isCustom:boolean, gameTypeSelectedObj:KlMatchType}, void>("Ingresa la cantidad de jugadores máximos del torneo", async (chat, info) => {
      const __playersPerTeamNeeded = info.isCustom ? TOURNAMENTFINAL.custom_players_per_team : info.gameTypeSelectedObj.players_per_team;

      const availablePhases = [1,2,3,4,5].map(n => n.toString());
      //Ask about how many phases the tournament will have, indicating the players needed for each phase
      const selectedNumberPhases = await chat.DialogWaitAnOptionFromList(
        availablePhases,
        ` Selecciona la cantidad de fases que desees para el torneo: (eg. 1 para una fase, 2 para 2 fases, etc...)
          Nota: Seleccionaste ${info.gameTypeSelectedObj.name} como modo de juego y necesita ${__playersPerTeamNeeded} jugadores por equipo `,
        ` Esa cantidad de fases no es valida, solo ingresa el número, nada más (e.g. 1 para una fase, 2 para 2 fases, etc...), prueba de nuevo: `,
        (number) =>
          ` ${number} ${number === "1" ? "fase" : "fases"}
            Esto requerirá: ${Math.pow(2, parseInt(number))} equipos y ${Math.pow(2, parseInt(number)) * __playersPerTeamNeeded} jugadores.
            . `,
        OUTSIDE_DefaultTimeout
      )

      TOURNAMENTFINAL.max_players = Math.pow(2, parseInt(selectedNumberPhases)) * __playersPerTeamNeeded;
    });

    dialog.AddStep("Ingresa la ventana de juego del torneo (el tiempo que tendrá cada jugador para realizar su partido): (En días, por ejemplo: 1, 2 ó 6 días, no se permite 0 ni negativos)", async (specificChat) => {
      const _daysNumber = await chat.AskForSpecificText(
        /^(?!-)(?!0+$)\d{1,2}$/,
        "No has ingresado un número valido, recuerda que el formato debe ser 'número de dias', por ejemplo: '10', prueba de nuevo: ",
        OUTSIDE_DefaultTimeout
      );
      TOURNAMENTFINAL.matchPeriodTime = parseInt(_daysNumber);
    })

    dialog.AddStep("Ahora elige la lista de rangos que serán admitidos para jugar en el torneo:", async () => {
      let _userStillWantsToStartSelectingRanksAgain = false;
      do {
        OUTSIDE_SelectedRanks.splice(0, OUTSIDE_SelectedRanks.length);
        const _ranksAvailable = await Kldb.rank.findMany();
        let _userWantToContinueSelecting = false;
        for (let i = 0; i < OUTSIDE_SelectedRanks.length; i++) OUTSIDE_SelectedRanks.pop();
        do {
          const _thisIterationRankSelected = await chat.DialogWaitAnOptionFromListObj(
            _ranksAvailable,
            (info, index) => (index + 1).toString(),
            '⚡ *Lista de Rangos Disponibles:* ⚡',
            '❌ Ese rango no existe. Por favor, selecciona el número de la lista. Ejemplo: "1" o "2". Intenta nuevamente:',
            (info, index) => `${index + 1}. *${info.name}*`
          );
          OUTSIDE_SelectedRanks.push(_thisIterationRankSelected);
          _ranksAvailable.splice(_ranksAvailable.indexOf(_thisIterationRankSelected), 1);
          // Feedback después de selección
          await chat.SendTxt(`
            ✅ Has seleccionado el rango: *${_thisIterationRankSelected.name}*.
            
            ¿Te gustaría seleccionar otro rango? 
            Ingresa *si* para continuar o *no* para finalizar.
          `);
          _userWantToContinueSelecting = Response_isAfirmativeAnswer(await chat.AskText(OUTSIDE_DefaultTimeout));
        } while (_userWantToContinueSelecting);
        // Resumen de los rangos seleccionados
        await chat.SendTxt(`
          🏆 *Rangos Seleccionados:*
          ${OUTSIDE_SelectedRanks.map((rank, index) => `${index + 1}. *${rank.name}*`).join('\n')}

          ¿Estás de acuerdo con estos rangos o prefieres elegir nuevamente?
          Ingresa *si* para elegir de nuevo o *no* para continuar con la creación del torneo.
        `);
        _userStillWantsToStartSelectingRanksAgain = Response_isAfirmativeAnswer(await chat.AskText(OUTSIDE_DefaultTimeout));
      } while (_userStillWantsToStartSelectingRanksAgain);
    })

    dialog.AddStep("Deseas ingresar una foto como portada del torneo? (Contesta si u ok, puedes omitirlo mandando cualquier otro msg)", async () => {
      const CREATIONDATESELECTED = Date.now();

      let COVERIMAGENAMESELECTED: string | null = null;
      const _responseee = await chat.AskText(OUTSIDE_DefaultTimeout);
      if (Response_isAfirmativeAnswer(_responseee)) {
        let isCorrectImage = false;
        await chat.SendTxt("Envía una imagen de portada para el torneo:")
        do {
          const __ImgMsg = await bot.Receive.WaitNextRawMsgFromId(args.chatId, args.userIdOrChatUserId, MsgType.image, OUTSIDE_DefaultTimeout, "Tienes que envíar una imagen para la portada, prueba de nuevo...");
          const __imgName = `${TOURNAMENTFINAL.name}-${CREATIONDATESELECTED}`;
          const __successStoring = await Db_TryToDownloadMedia(__ImgMsg, __imgName, "png", "db/tournaments_covers");
          if (__successStoring) {
            await chat.SendTxt("Imagen guardada exitosamente!");
            isCorrectImage = true;
            COVERIMAGENAMESELECTED = __imgName + ".png";
            TOURNAMENTFINAL.cover_img_name = COVERIMAGENAMESELECTED
            // @ts-ignore
            TOURNAMENTFINAL.creationDate = CREATIONDATESELECTED
            TOURNAMENTFINAL.endDate = null
          }
          else {
            await chat.SendTxt("Error al guardar la imagen..., quieres seguir intentándolo?");
            isCorrectImage = Response_isAfirmativeAnswer(await chat.AskText(OUTSIDE_DefaultTimeout));
          }
        } while (!isCorrectImage);
      } else {
        await chat.SendTxt("Omitiendo imagen de portada...");
      }
      OUTSIDE_storedImg = COVERIMAGENAMESELECTED;


      await chat.SendTxt(`
        Estás a nada de crear el torneo, este es el resumen de lo que se ha hecho hasta ahora:
        
        Información General:
        ${Str_StringifyObj(TOURNAMENTFINAL, 4)}

        Rangos Seleccionados:
        ${Str_StringifyObj(OUTSIDE_SelectedRanks, 4)}

        ¿Estás de acuerdo con estos datos?
        Ingresa *si* para terminar de guardar los datos o *no* para cancelar esta creación y volver a intentarlo después.
      `)
    })

    try {
      await dialog.StartConversation();

      if (!Response_isAfirmativeAnswer(await chat.AskText(OUTSIDE_DefaultTimeout))) {
        await chat.SendTxt("Cancelando creación del torneo...");
        try {
          fs.unlinkSync(`db/tournaments_covers/${OUTSIDE_storedImg}`);
        }
        catch (e) {
          KlLogger.error(`Error deleting tournament cover on abort tournament creation: ${e}`);
        }
      }

      const fullTournamentInfo = await Kldb.tournament.create({ data: (TOURNAMENTFINAL as KlTournament) });
      for (const selectedRank of OUTSIDE_SelectedRanks) {
        await Kldb.tournament_Rank_RanksAdmitted.create({
          data:
          {
            tournament_id: fullTournamentInfo.id,
            rank_id: selectedRank.id
          }
        })
      }
      await chat.SendTxt(`El torneo se ha creado con éxito!. Fin`);

    } catch (e) {
      KlLogger.error(`Error creando torneo: ${JSON.stringify(e, null, 0)}`);
      Msg_DefaultHandleError(bot, args.chatId, e);
      if (OUTSIDE_storedImg) {
        try {
          fs.unlinkSync(`db/tournaments_covers/${OUTSIDE_storedImg}`);
        }
        catch (e) {
          KlLogger.error(`Error deleting tournament cover on abort tournament creation: ${e}`);
        }
      }
    }
  }
}

function CustomLog(number:number, base:number){
  return Math.log(number) / Math.log(base);
}