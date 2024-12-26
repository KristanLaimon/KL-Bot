
/**
 * Generates a function that iterates over a list of instructions, returning each formatted with its step number.
 *
 * @example
 * const nextInstruction = GenerateInstructionSteps([
 *   "Ingresa el nombre del torneo",
 *   "Ingresa la descripción del torneo",
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
export function GenerateInstructionSteps(instructions: string[]): () => string {
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
