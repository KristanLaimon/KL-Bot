import fs from "fs"
import Bot from '../../../bot';
import KlLogger from '../../../bot/logger';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, CommandScopeType, CommandAccessibleRoles, MsgType, CommandHelpInfo } from '../../../types/commands';
import { KlTournament } from '../../../types/db';
import { Dates_12HrsInputRegex, Dates_Add12hrsTimeToMomentObj, Dates_ConvertDateInputToMomentJs, Dates_DateInputRegex } from '../../../utils/dates';
import Kldb from '../../../utils/db';
import { GenerateInstructionSteps } from '../../../utils/dialog';
import { Db_TryToDownloadMedia } from '../../../utils/filesystem';
import { Msg_DefaultHandleError } from '../../../utils/rawmsgs';
import { Response_isAfirmativeAnswer, Response_isNegativeAnswer } from '../../../utils/responses';

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
    let storedImg: string | null = null;
    try {
      await chat.SendTxt(`====== Creación de un torneo =====`);
      const defaultTimeout = 250
      const step = GenerateInstructionSteps([
        "Ingresa el tipo de torneo:",
        "Ingresa el nombre del torneo:",
        "Ingresa la descripción del torneo:",
        "Ingresa el tipo de partidas que tendrá el torneo:",
        "Ingresa la cantidad de jugadores máximo del torneo:",
        "Ingresa la fecha de inicio: (Formato: 'año/mes/día', por ejemplo: '2022/enero/25')",
        "Ingresa la hora de inicio: (Formato: 'hora:minutos AM o PM', por ejemplo: '8:00 AM' ó '5:00 PM')",
        //Period/Window time in days to play each match (2 digits number)
        'Ingresa la ventana de juego del torneo (el tiempo que tendrá cada jugador para realizar su partido): (En días, por ejemplo: 1, 2 ó 6 días)',
        'Ahora elige la lista de rangos que serán admitidos para jugar en el torneo:',
        'Deseas ingresar una foto como portada del torneo? (Contesta si u ok, puedes omitirlo mandando cualquier otro msg)'
      ])

      // TYPE
      await chat.SendTxt(step());
      const _typesAvailable = await Kldb.tournamentType.findMany();
      const _typeSelected = await chat.DialogWaitAnOptionFromListObj(
        _typesAvailable,
        (info, index) => (index + 1).toString(),
        "Lista de tipos de torneos disponibles:",
        "Ese tipo no existe, selecciona el número de la lista, e.g: '1' para eliminación simple, prueba de nuevo:",
        (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
        defaultTimeout
      );
      const TYPESELECTED = _typeSelected.id;

      // NAME
      await chat.SendTxt(step());
      const NAMESELECTED = await chat.WaitNextTxtMsgFromSender(defaultTimeout);

      // DESCRIPTION
      await chat.SendTxt(step());
      const DESCRIPTIONSELECTED = await chat.WaitNextTxtMsgFromSender(defaultTimeout);



      //GAME TYPE / MATCH FORMAT
      await chat.SendTxt(step());
      const _allGameTypes = await Kldb.matchType.findMany({ orderBy: { id: "asc" } });
      let SELECTED_IS_CUSTOM = false;
      let SELECTED_custom_players_per_team = -1;
      const _gameTypeSelected = await chat.DialogWaitAnOptionFromListObj(
        _allGameTypes,
        (info, index) => (index + 1).toString(),
        "Lista de tipos de partidas disponibles:",
        "Ese tipo no existe, selecciona el número de la lista, e.g: '1' para 1vs1, prueba de nuevo:",
        (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
        defaultTimeout
      );
      //Is custom game
      if (_gameTypeSelected.id === "CU") {
        SELECTED_IS_CUSTOM = true;

        const __allGameTypesExceptSomeOnes = await Kldb.matchType.findMany({ where: { NOT: { id: { in: ["1S", "2S", "3S"] } } }, orderBy: { id: "asc" } });
        const __gameTypeSelectedAgain = await chat.DialogWaitAnOptionFromListObj(
          __allGameTypesExceptSomeOnes,
          (info, index) => (index + 1).toString(),
          "== CUSTOM ==\nLista de tipos de partidas personalizadas disponibles:",
          "Ese tipo no existe, selecciona el número de la lista, e.g: '1' ó '2', prueba de nuevo:",
          (info, index) => `${index + 1}. ${info.id} | ${info.name}`,
          defaultTimeout
        );
        _gameTypeSelected.id = __gameTypeSelectedAgain.id

        await chat.SendTxt(`Has elegido ${__gameTypeSelectedAgain.name}, indica el número de jugadores por equipo personalizado: (Ejemplo: '2' para 2 jugadores por equipo)`);
        const _customMaxPlayers = await chat.WaitNextTxtMsgFromSenderSpecific(
          /^\d{1}$/,
          "No has ingresado un número valido, recuerda que el formato debe ser un 'número de jugadores', por ejemplo: '2' pero no más de '10', prueba de nuevo: ",
          defaultTimeout
        );
        SELECTED_custom_players_per_team = parseInt(_customMaxPlayers);
      }
      const SELECTEDGAMETYPE = _gameTypeSelected.id;

      //Max players 
      let _isValidMaxPlayers = false;
      let MAXPLAYERSSELECTED: number = 0;
      let _textToSend = step();
      do {
        await chat.SendTxt(_textToSend);
        const __maxPlayers = await chat.WaitNextTxtMsgFromSenderSpecific(
          /^\d{1,2}$/,
          "No has ingresado un número valido, recuerda que el formato debe ser un 'número de jugadores', por ejemplo: '10' pero no más de '99', prueba de nuevo: ",
          defaultTimeout
        );
        MAXPLAYERSSELECTED = parseInt(__maxPlayers);

        const __playersPerTeamNeeded = SELECTED_IS_CUSTOM ? SELECTED_custom_players_per_team : _gameTypeSelected.players_per_team;
        const remainderPlayers = MAXPLAYERSSELECTED % __playersPerTeamNeeded;

        if (remainderPlayers !== 0) {
          await chat.SendTxt(`El número de jugadores por equipo debe ser un concordar con el tamaño de ${__playersPerTeamNeeded}, si hiciera equipos de ${__playersPerTeamNeeded} jugadores, terminaría sobrando ${remainderPlayers} jugadores...`);
        } else {
          _isValidMaxPlayers = true;
        }

      } while (!_isValidMaxPlayers);

      // START DATE
      await chat.SendTxt(step());
      const _formatedDate = await chat.WaitNextTxtMsgFromSenderSpecific(
        Dates_DateInputRegex,
        "No has ingresado un fecha válida, recuerda que el formato debe ser 'año/mes/día', por ejemplo: '2022/enero/25', prueba de nuevo: ",
        defaultTimeout
      );
      const STARTDATESELECTED = Dates_ConvertDateInputToMomentJs(_formatedDate);

      // HOUR DATE START
      await chat.SendTxt(step());
      const _formatedHour = await chat.WaitNextTxtMsgFromSenderSpecific(
        Dates_12HrsInputRegex,
        "No has ingresado una hora valida, recuerda que el formato debe ser 'hora:minutos AM/PM', por ejemplo: '10:30 AM', prueba de nuevo: ",
        defaultTimeout
      );
      if (Dates_Add12hrsTimeToMomentObj(STARTDATESELECTED, _formatedHour) === false)
        throw new Error("No debería pasar!!!");

      // Period/Window time in days to play each match (2 digits number)
      await chat.SendTxt(step());
      const _daysNumber = await chat.WaitNextTxtMsgFromSenderSpecific(
        /^\d{1,2}$/,
        "No has ingresado un número valido, recuerda que el formato debe ser 'número de dias', por ejemplo: '10', prueba de nuevo: ",
        defaultTimeout
      );
      const WINDOWDAYSSELECTED = parseInt(_daysNumber);

      // Ranks Admitted to tournament
      await chat.SendTxt(step());
      const SELECTEDRANKS: Awaited<ReturnType<typeof Kldb.rank.findMany>> = [];
      let _userStillWantsToStartSelectingRanksAgain = false;
      do {
        const _ranksAvailable = await Kldb.rank.findMany();
        let _userWantToContinueSelecting = false;
        for (let i = 0; i < SELECTEDRANKS.length; i++) SELECTEDRANKS.pop();
        do {
          const _thisIterationRankSelected = await chat.DialogWaitAnOptionFromListObj(
            _ranksAvailable,
            (info, index) => (index + 1).toString(),
            '⚡ *Lista de Rangos Disponibles:* ⚡',
            '❌ Ese rango no existe. Por favor, selecciona el número de la lista. Ejemplo: "1" o "2". Intenta nuevamente:',
            (info, index) => `${index + 1}. *${info.name}*`
          );
          SELECTEDRANKS.push(_thisIterationRankSelected);
          _ranksAvailable.splice(_ranksAvailable.indexOf(_thisIterationRankSelected), 1);
          // Feedback después de selección
          await chat.SendTxt(`
            ✅ Has seleccionado el rango: *${_thisIterationRankSelected.name}*.
            
            ¿Te gustaría seleccionar otro rango? 
            Ingresa *si* para continuar o *no* para finalizar.
          `);
          _userWantToContinueSelecting = Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout));
        } while (_userWantToContinueSelecting);
        // Resumen de los rangos seleccionados
        await chat.SendTxt(`
          🏆 *Rangos Seleccionados:*
          ${SELECTEDRANKS.map((rank, index) => `${index + 1}. *${rank.name}*`).join('\n')}

          ¿Estás de acuerdo con estos rangos o prefieres elegir nuevamente?
          Ingresa *si* para elegir de nuevo o *no* para continuar con la creación del torneo.
        `);
        _userStillWantsToStartSelectingRanksAgain = Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout));
      } while (_userStillWantsToStartSelectingRanksAgain);

      //Optional cover image
      await chat.SendTxt(step());
      const CREATIONDATESELECTED = Date.now();

      let COVERIMAGENAMESELECTED: string | null = null;
      const _responseee = await chat.WaitNextTxtMsgFromSender(defaultTimeout);
      if (Response_isAfirmativeAnswer(_responseee)) {
        let isCorrectImage = false;
        await chat.SendTxt("Envía una imagen de portada para el torneo:")
        do {
          const __ImgMsg = await bot.Receive.WaitNextRawMsgFromId(args.chatId, args.userIdOrChatUserId, MsgType.image, defaultTimeout, "Tienes que envíar una imagen para la portada, prueba de nuevo...");
          const __imgName = `${NAMESELECTED}-${CREATIONDATESELECTED}`;
          const __successStoring = await Db_TryToDownloadMedia(__ImgMsg, __imgName, "png", "db/tournaments_covers");
          if (__successStoring) {
            await chat.SendTxt("Imagen guardada exitosamente!");
            isCorrectImage = true;
            COVERIMAGENAMESELECTED = __imgName + ".png";
          }
          else {
            await chat.SendTxt("Error al guardar la imagen..., quieres seguir intentándolo?");
            isCorrectImage = Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout));
          }
        } while (!isCorrectImage);
      } else {
        await chat.SendTxt("Omitiendo imagen de portada...");
      }
      storedImg = COVERIMAGENAMESELECTED;

      const tournamentObj: KlTournament = {
        id: undefined,
        name: NAMESELECTED,
        description: DESCRIPTIONSELECTED,
        ///@ts-ignore
        creationDate: CREATIONDATESELECTED,
        ///@ts-ignore
        beginDate: STARTDATESELECTED.valueOf(),
        matchPeriodTime: WINDOWDAYSSELECTED,
        endDate: null,
        cover_img_name: COVERIMAGENAMESELECTED,
        tournament_type: TYPESELECTED,
        max_players: MAXPLAYERSSELECTED,
        match_format: SELECTEDGAMETYPE,
        is_custom: SELECTED_IS_CUSTOM,
        custom_players_per_team: SELECTED_custom_players_per_team
      }

      await chat.SendTxt(`
        Estás a nada de crear el torneo, este es el resumen de lo que se ha hecho hasta ahora:
        
        Información General:
        ${JSON.stringify(tournamentObj, null, 4)}

        Rangos Seleccionados:
        ${JSON.stringify(SELECTEDRANKS, null, 4)}

        ¿Estás de acuerdo con estos datos?
        Ingresa *si* para terminar de guardar los datos o *no* para cancelar esta creación y volver a intentarlo después.
      `)

      if (!Response_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout))) {
        await chat.SendTxt("Cancelando creación del torneo...");
        try {
          fs.unlinkSync(`db/tournaments_covers/${storedImg}`);
        }
        catch (e) {
          KlLogger.error(`Error deleting tournament cover on abort tournament creation: ${e}`);
        }
      }

      const fullTournamentInfo = await Kldb.tournament.create({ data: tournamentObj });

      for (const selectedRank of SELECTEDRANKS) {
        await Kldb.tournament_Rank_RanksAdmitted.create({
          data:
          {
            tournament_id: fullTournamentInfo.id,
            rank_id: selectedRank.id
          }
        })
      }

      await chat.SendTxt(`El torneo se ha creado con exito!. Fin`);

    } catch (e) {
      KlLogger.error(`Error creando torneo: ${JSON.stringify(e, null, 0)}`);
      Msg_DefaultHandleError(bot, args.chatId, e);
      if (storedImg) {
        try {
          fs.unlinkSync(`db/tournaments_covers/${storedImg}`);
        }
        catch (e) {
          KlLogger.error(`Error deleting tournament cover on abort tournament creation: ${e}`);
        }
      }
    }
  }
}

