import { SpecificChat } from "./SpecificChat";
import Bot from "../bot";
import { BotCommandArgs } from "../types/bot";

export type SpecificDialogStep = {
  InitialMsg: string;
  Logic: (specificChat: SpecificChat, previousValue: any) => Promise<any>;
};

export default class SpecificDialog {
  private steps : SpecificDialogStep[] = [];
  private readonly specificChat: SpecificChat;

  constructor(private bot:Bot, private args: BotCommandArgs, private options?: {withNumeratedSteps?: boolean}) {
    this.specificChat = new SpecificChat(bot, args);
  }


  /**
   * Adds a step to the conversation.
   * The first argument is the initial message of the step, and the second argument is a function that will be called after the initial message of the step has been sent.
   * The `Logic` function should do any necessary logic to end the step and prepare the next step.
   * @example
   * dialog.AddStep("Your name?", (chat, previousValue) => {
   *   return chat.AskForText("Your name?");
   * });
   * @example
   * dialog.AddStep("Your age?", (chat, previousValue) => {
   *   return chat.AskForNumber("Your age?");
   * });
   * @example
   * dialog.AddStep("Your age?", (chat, previousValue) => {
   *   return chat.AskForText("Your age?", {withNumber: true});
   * });
   * @example
   * dialog.AddStep("Your age?", (chat, previousValue) => {
   *   return chat.AskForText("Your age?", {withNumber: true, regex: /^\d+$/});
   * });
   * @example
   * dialog.AddStep("Your age?", (chat, previousValue) => {
   *   return chat.AskForText("Your age?", {withNumber: true, regex: /^\d+$/, withCancelOption: true});
   * });
   */
  public AddStep<TInput = unknown, TOutput = void>(initialRawMsg:string, logic: (specificChat:SpecificChat, previousValue:TInput) => Promise<TOutput>) {
    this.steps.push({InitialMsg: initialRawMsg, Logic: logic});
  }

  /**
   * Starts the conversation with the user.
   * If `withNumeratedSteps` is `true`, the steps will be numerated and the user will be shown the current step number.
   * Otherwise, the steps will be shown as just the initial message of each step.
   * The `Logic` function of each step will be called after the initial message of the step has been sent.
   * The `Logic` function of each step should do any necessary logic to end the step and prepare the next step.
   */
  public async StartConversation<ExpectedReturn = undefined>(){
    let previousValue:ExpectedReturn;

    if(this.options && this.options.withNumeratedSteps){
      const formatedStep = this.GenerateInstructionSteps(this.steps.map(step => step.InitialMsg));
      for (const step of this.steps) {
        await this.specificChat.SendTxt(formatedStep());
        previousValue = await step.Logic(this.specificChat, previousValue);
      }
    }else{
      for (const stepObjInfo of this.steps) {
        await this.specificChat.SendTxt(stepObjInfo.InitialMsg);
        previousValue = await stepObjInfo.Logic(this.specificChat, previousValue);
      }
    }

    return previousValue;
  }

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
  private GenerateInstructionSteps(instructions: string[]): () => string {
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
}