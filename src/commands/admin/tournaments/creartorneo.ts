import Bot from '../../../bot';
import { SpecificChat } from '../../../bot/SpecificChat';
import { BotCommandArgs } from '../../../types/bot';
import { ICommand, ScopeType, CommandAccessibleRoles } from '../../../types/commands';
import { Dates_12HrsInputRegex, Dates_Add12hrsTimeToMomentObj, Dates_ConvertDateInputToMomentJs, Dates_DateInputRegex } from '../../../utils/dates';
import Kldb from '../../../utils/db';
import { Msg_DefaultHandleError } from '../../../utils/rawmsgs';

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
        "Ingresa la fecha de inicio: (Formato: 'año/mes/día', por ejemplo: '2022/enero/25')",
        "Ingresa la hora de inicio: (Formato: 'hora:minutos AM o PM', por ejemplo: '8:00 AM' ó '5:00 PM')",

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

      await chat.SendTxt("Vas bienn papu.. finnnn");
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
