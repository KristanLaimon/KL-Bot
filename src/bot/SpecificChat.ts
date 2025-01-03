import Bot from "../bot";
import { BotCommandArgs } from "../types/bot";
import { MsgType } from "../types/commands";
import { Msg_GetTextFromRawMsg } from "../utils/rawmsgs";
import { Str_NormalizeLiteralString, Str_StringifyObj } from "../utils/strings";
import { Db_GetTournamentFormattedInfoStr } from "../utils/db";
import { KlTournament } from "../types/db";
import KlLogger from "./logger";
import { MiscMessageGenerationOptions, WAMessage } from "@whiskeysockets/baileys";

export class SpecificChat {
  private readonly bot: Bot;
  private args: BotCommandArgs;

  constructor(bot: Bot, specificArgs: BotCommandArgs, customChatIdToSend?: string) {
    this.bot = bot;
    this.args = structuredClone(specificArgs);
    if (customChatIdToSend) this.args.chatId = customChatIdToSend;
  }

  ///================== Sending ====================
  /**
   * Sends a text message to the specified chat.
   *
   * @param msg - The text message to be sent.
   *
   * @param sanitizeText
   * @param misc
   * @returns A promise that resolves when the text message has been sent successfully.
   */
  async SendTxt(msg: string, sanitizeText:boolean = true, misc?: MiscMessageGenerationOptions): Promise<void> {
    await this.bot.Send.Text(this.args.chatId, msg, sanitizeText, misc);
  }

  /**
   * Sends an image to the specified chat.
   *
   * @param imgPath - The file path of the image to be sent.
   * @param caption - Optional. The caption for the image.
   * @param sanitizeCaption
   * @param misc
   * @returns A promise that resolves when the image has been sent successfully.
   */
  async SendImg(imgPath: string, caption?: string, sanitizeCaption:boolean = true, misc?: MiscMessageGenerationOptions): Promise<void> {
    await this.bot.Send.Img(this.args.chatId, imgPath, caption, sanitizeCaption, misc);
  }

  async SendReaction(originalRawMsg:WAMessage, emojiStr:string){
    await this.bot.Send.ReactEmojiTo(this.args.chatId, originalRawMsg, emojiStr);
  }

  async SendReactionToOriginalMsg(emojiStr:"✅" | "❌" | "⌛" | string){
    await this.SendReaction(this.args.originalMsg, emojiStr);
  }

  async SendTournamentInfoFormatted(tournamentInfo:KlTournament, personalizeMsg?: (alreadyMsg:string, tournamentInfo?:KlTournament) => string):Promise<boolean>{
    try{
      let fullTournamentInfo = await Db_GetTournamentFormattedInfoStr(tournamentInfo.id);
      if(personalizeMsg) fullTournamentInfo = Str_NormalizeLiteralString(personalizeMsg(fullTournamentInfo, tournamentInfo));
      if (tournamentInfo.cover_img_name !== null)
        await this.SendImg(`db/tournaments_covers/${tournamentInfo.cover_img_name}`, fullTournamentInfo);
      else
        await this.SendTxt(fullTournamentInfo);
      return true;
    }catch(e){
      KlLogger.error(`Failed to send tournament info: ${Str_StringifyObj(e)}`);
      return false;
    }

  }

  //================== Receiving (Basic) =====================
  /**
   * Waits for the next text message from the sender and returns it.
   *
   * @param timeout - Optional timeout in seconds for waiting for a response. Default is 30 seconds.
   *
   * @returns A promise that resolves with the text message from the sender.
   *
   * @throws {BotWaitMessageError} If the user cancels the operation or if the timeout is reached.
   */
  async AskText(timeout?: number): Promise<string> {
    const rawMsg = await this.bot.Receive.WaitNextRawMsgFromId(this.args.chatId, this.args.userIdOrChatUserId, MsgType.text, timeout);
    return Msg_GetTextFromRawMsg(rawMsg);
  }

  /**
   * Waits for the next text message from the specified phone number and returns it.
   *
   * @param phoneNumberCleaned - The cleaned phone number (without country code) to wait for.
   * @param timeout - Optional timeout in seconds for waiting for a response. Default is 30 seconds.
   * @param wrongMsg - Optional error message to send if the incoming message does not match the expected format.
   *
   * @returns A promise that resolves with the text message from the specified phone number.
   *
   * @throws {BotWaitMessageError} If the user cancels the operation or if the timeout is reached.
   */
  async WaitNextTxtMsgFromPhone(phoneNumberCleaned: string, timeout?: number, wrongMsg?: string): Promise<string> {
    const rawMsg = await this.bot.Receive.WaitNextRawMsgFromPhone(this.args.chatId, this.args.userIdOrChatUserId, phoneNumberCleaned, MsgType.text, timeout, wrongMsg);
    return Msg_GetTextFromRawMsg(rawMsg);
  }


  /**
   * Waits for the next text message from the sender with a specific format and returns it.
   * If the message does not match the expected format, sends an error message and waits for another message.
   *
   * @param regexExpecingFormat - The regular expression that the incoming message should match.
   * @param wrongMsg - The error message to send if the incoming message does not match the expected format.
   * @param timeout - Optional timeout in seconds for waiting for a response. Default is 30 seconds.
   * @returns A promise that resolves with the text message from the sender that matches the expected format.
   * @throws {BotWaitMessageError} If the user cancels the operation or if the timeout is reached.
   */
  async AskForSpecificText(regexExpecingFormat: RegExp, wrongMsg: string, timeout?: number): Promise<string> {
    return await WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(this.bot, this.args.chatId, this.args.userIdOrChatUserId, regexExpecingFormat, wrongMsg, timeout);
  }

  async AskForNumber(maxDigitNumber: number, wrongMsg: string, timeout?: number):Promise<number>{
    const numberStr = await WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(this.bot, this.args.chatId, this.args.userIdOrChatUserId, new RegExp(`^[0-9]{${maxDigitNumber}}$`), wrongMsg, timeout);
    return parseFloat(numberStr);
  }

  // async WaitUntilTxtMsgFromPhone(phoneNumberCleaned: string, regexFormatExpected: RegExp, timeout?: number)

  //====================== Dialog (Advanced receiving) ==========================

  /**
   * Presents a list of options to the user, waits for them to select one, and returns the selected option.
   *
   * @param {string[]} possibleResults - An array of all available options.
   * @param {string} startMsg - The initial message to display to the user before showing the options.
   * @param {string} errorMsg - The message to display if the user makes an invalid selection.
   * @param {(element: string, index: number) => string} formatEachElementCallback - A function that formats how each option is displayed to the user.
   * @param {number} [timeout] - Optional timeout in seconds for user response.
   * @param options
   * @param misc
   * @returns {Promise<string>} A promise that resolves with the selected option.
   * @throws {Error} Throws an error if no matching option is found (which should not happen under normal circumstances).
   */
  async DialogWaitAnOptionFromList(possibleResults: string[], startMsg: string, errorMsg: string, formatEachElementCallback: (element: string, index: number) => string, timeout?: number, options?:{withDoubleSeparationOptions?:boolean}, misc?: MiscMessageGenerationOptions): Promise<string> {
    const possibleResultsRegex = new RegExp(`^(${possibleResults.join("|")})$`);
    let fullMsg: string = errorMsg;
    let optionsTxt: string = possibleResults.map(formatEachElementCallback).join(options && options.withDoubleSeparationOptions ? "\n\n" : "\n");
    fullMsg += "\n";
    fullMsg += optionsTxt;
    await this.bot.Send.Text(this.args.chatId, startMsg + "\n\n" + optionsTxt, true, misc);
    return await WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(this.bot, this.args.chatId, this.args.userIdOrChatUserId, possibleResultsRegex, fullMsg, timeout);
  }

  /**
   * Presents a list of options to the user and waits for them to select one.
   *
   * @template T - The type of objects in the options list.
   * @param {T[]} allOptionsObj - An array of all available options.
   * @param {function(T, number): string} selectPropCallback - A function that selects a property from each option object to use as the selectable value.
   * @param {string} startingMsg - The initial message to display to the user before showing the options.
   * @param {string} errorMsg - The message to display if the user makes an invalid selection.
   * @param {function(T, number): string} formatElementCallBack - A function that formats how each option is displayed to the user.
   * @param {number} [timeout] - Optional timeout in seconds for user response.
   * @param options
   * @param misc
   * @returns {Promise<T>} A promise that resolves with the selected option object.
   * @throws {Error} Throws an error if no matching object is found (which should not happen under normal circumstances).
   */
  async DialogWaitAnOptionFromListObj<T>(
    allOptionsObj: T[],
    selectPropCallback: (optionObj: T, index: number) => string,
    startingMsg: string,
    errorMsg: string,
    formatElementCallBack: (element: T, index: number) => string,
    timeout?: number,
    options?:{withDoubleSeparationOptions?:boolean},
    misc?: MiscMessageGenerationOptions
  ): Promise<T> {
    const selectedProps = allOptionsObj.map(selectPropCallback);
    const selectedByUser = await this.DialogWaitAnOptionFromList(
      selectedProps,
      Str_NormalizeLiteralString(startingMsg),
      Str_NormalizeLiteralString(errorMsg),
      (elementStr, index) => Str_NormalizeLiteralString(formatElementCallBack(allOptionsObj[index], index)),
      timeout,
      options,
      misc
    );
    const selectedObj = allOptionsObj.find((optionObj, index) => selectPropCallback(optionObj, index) === selectedByUser);
    if (!selectedObj) throw new Error("This shouln't have happened");
    return selectedObj;
  }

}

/**
 * Expect a TEXT message from the user with a specific format (with regex) or throws error if user cancel the operation or 
 * max message timeout in seconds has been reached.
 * @param chatSenderId ChatId where the message comes from
 * @param participantId  UserId of the participant that sent the message (if it is individual chat, it's the same as chatSenderId)
 * @param regexExpectingFormat  A small object giving the regex and the error message to be sent to the user if the message does not match the expected format
 * @param timeout  Time in seconds to wait for the user to respond
 * @throws {BotWaitMessageError} if user has CANCELLED the operation or if timeout has been reached
 * @returns  The message sent by the user
 */
async function WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(bot: Bot, chatSenderId: string, participantId: string, regex: RegExp, wrongAnswerInfoMsg: string, timeout: number = 30): Promise<string> {
  let isValidResponse: boolean = false;
  let userResult: string;
  do {
    userResult = Msg_GetTextFromRawMsg(await bot.Receive.WaitNextRawMsgFromId(chatSenderId, participantId, MsgType.text, timeout));
    if (regex.test(userResult))
      isValidResponse = true
    else {
      bot.Send.Text(chatSenderId, wrongAnswerInfoMsg);
    }
  } while (!isValidResponse);
  return userResult;
}