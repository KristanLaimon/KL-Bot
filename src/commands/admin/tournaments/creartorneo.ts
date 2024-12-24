import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, ScopeType, CommandAccessibleRoles } from '../../../types/commands';
import { Dates_12HrsInputRegex, Dates_Add12hrsTimeToMomentObj, Dates_ConvertDateInputToMomentJs, Dates_DateInputRegex } from '../../../utils/dates';
import Kldb from '../../../utils/db';
import { Msg_DefaultHandleError } from '../../../utils/rawmsgs';
import { Reponse_isAfirmativeAnswer } from '../../../utils/responses';

export default class CreateTournamentCommand implements ICommand {
  commandName: string = "creartorneo";
  description: string = "Crea un nuevo torneo en el servidor. Incluye opciones para especificar el nombre del torneo, descripción, fecha de inicio, ventana de juego, y rangos de participantes.";
  maxScope: ScopeType = "Group";
  minimumRequiredPrivileges: CommandAccessibleRoles = "Administrador";
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    const chat = new SpecificChat(bot, args);

    try {
      await chat.SendTxt(`====== Creación de un torneo =====`);
      const defaultTimeout = 250
      const step = GenerateInstructionSteps([
        "Ingresa el tipo de torneo:",
        "Ingresa el nombre del torneo:",
        "Ingresa la descripción del torneo:",
        "Ingresa la cantidad de jugadores máximo del torneo:",
        "Ingresa la fecha de inicio: (Formato: 'año/mes/día', por ejemplo: '2022/enero/25')",
        "Ingresa la hora de inicio: (Formato: 'hora:minutos AM o PM', por ejemplo: '8:00 AM' ó '5:00 PM')",
        //Period/Window time in days to play each match (2 digits number)
        'Ingresa la ventana de juego del torneo (el tiempo que tendrá cada jugador para realizar su partido): (En días, por ejemplo: 10, 15, 20, 30, 45, 60, 90 pero no más de 99)',
        'Ahora elige la lista de rangos que serán admitidos para jugar en el torneo:'
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

      //Max players 
      await chat.SendTxt(step());
      const _maxPlayers = await chat.WaitNextTxtMsgFromSenderSpecific(
        /^\d{1,2}$/,
        "No has ingresado un número valido, recuerda que el formato debe ser un 'número de jugadores', por ejemplo: '10' pero no más de '99', prueba de nuevo: ",
        defaultTimeout
      );
      const MAXPLAYERSSELECTED = parseInt(_maxPlayers);

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
      let _userStillWantsToStartSelectingRanksAgain = false;
      do {
        const _ranksAvailable = await Kldb.rank.findMany();
        const SELECTEDRANKS: Awaited<ReturnType<typeof Kldb.rank.findMany>> = [];
        let _userWantToContinueSelecting = false;
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
          _userWantToContinueSelecting = Reponse_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout));
        } while (_userWantToContinueSelecting);
        // Resumen de los rangos seleccionados
        await chat.SendTxt(`
          🏆 *Rangos Seleccionados:*
          ${SELECTEDRANKS.map((rank, index) => `${index + 1}. *${rank.name}*`).join('\n')}

          ¿Estás de acuerdo con estos rangos o prefieres elegir nuevamente?
          Ingresa *si* para elegir de nuevo o *no* para continuar con la creación del torneo.
        `);
        _userStillWantsToStartSelectingRanksAgain = Reponse_isAfirmativeAnswer(await chat.WaitNextTxtMsgFromSender(defaultTimeout));
      } while (_userStillWantsToStartSelectingRanksAgain);


      const CREATIONDATESELECTED = Date.now();

      //Here comes specific detailes depending on the tournament type

      //TODO: Check if necesary to have a try catch inside onCreation() method
      /**
       * each class must have a onCreation(bot:Bot, args:BotCommandArgs, tournamentArgs: TournamentArgs)
       * and return {
       *  endDate: number (UNIX timestamp),
       *  plannedTimeWindows: PlannedTimeWindows[] (Ordered by date)
       * }
       */

    } catch (e) {
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}


/**
 * Generates a function that iterates over a list of instructions, returning each formatted with its step number.
 *
 * @example
 * const nextInstruction = GenerateInstructionSteps([
 *   "Ingresa el nombre del torneo",
 *   "Ingresa la descripci n del torneo",
 *   "Ingresa la fecha de inicio del torneo",
 *   "Ingresa la ventana de juego del torneo"
 * ]);
 *
 * console.log(nextInstruction()); // "Paso 1 de 4: Ingresa el nombre del torneo"
 * console.log(nextInstruction()); // "Paso 2 de 4: Ingresa la descripci n del torneo"
 * console.log(nextInstruction()); // "Paso 3 de 4: Ingresa la fecha de inicio del torneo"
 * console.log(nextInstruction()); // "Paso 4 de 4: Ingresa la ventana de juego del torneo"
 * console.log(nextInstruction()); // "Paso 1 de 4: Ingresa el nombre del torneo" (cycles back to the first instruction)
 *
 * @param instructions - An array of instruction strings to be formatted and iterated over.
 * @returns A function that, when called, returns the next instruction in the sequence, formatted as "Paso X de Y: [instruction]".
 *          The function cycles back to the first instruction after reaching the last one.
 */
function GenerateInstructionSteps(instructions: string[]): () => string {
  const formattedInstructions: string[] = [];
  for (let i = 0; i < instructions.length; i++) {
    formattedInstructions.push(`Paso ${i + 1} de ${instructions.length}: ${instructions[i]}`);
  }
  let actualIndexIterator = 0;
  return () => {
    const instruction = formattedInstructions[actualIndexIterator];
    actualIndexIterator = (actualIndexIterator + 1) % formattedInstructions.length;
    return instruction;
  }
}
