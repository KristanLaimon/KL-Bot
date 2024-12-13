import Bot from '../bot';
import { BotCommandArgs, WaitTextRegexFormat } from '../types/bot';
import { MsgType } from '../types/commands';
import { Msg_GetTextFromRawMsg } from '../utils/rawmsgs';


export class SpecificChat {
  private bot: Bot;
  private args: BotCommandArgs;
  constructor(bot: Bot, specificArgs: BotCommandArgs) {
    this.bot = bot;
    this.args = specificArgs;
  }
  ///================== Sending ====================
  async SendTxt(msg: string): Promise<void> {
    await this.bot.Send.Text(this.args.chatId, msg);
  }
  async SendImg(imgPath: string, caption?: string): Promise<void> {
    await this.bot.Send.Img(this.args.chatId, imgPath, caption);
  }

  //================== Receiving (Basic) =====================
  async WaitNextTxtMsgFromSender(timeout?: number): Promise<string> {
    const rawMsg = await this.bot.Receive.WaitNextRawMsgFromId(this.args.chatId, this.args.userId, MsgType.text, timeout);
    return Msg_GetTextFromRawMsg(rawMsg);
  }

  async WaitNextTxtMsgFromPhone(phoneNumberCleaned: string, timeout?: number, wrongMsg?: string): Promise<string> {
    const rawMsg = await this.bot.Receive.WaitNextRawMsgFromPhone(this.args.chatId, this.args.userId, phoneNumberCleaned, MsgType.text, timeout, wrongMsg);
    return Msg_GetTextFromRawMsg(rawMsg);
  }

  async WaitNextTxtMsgFromSenderSpecific(regexExpecingFormat: RegExp, wrongMsg: string, timeout?: number,): Promise<string> {
    return await WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(this.bot, this.args.chatId, this.args.userId, regexExpecingFormat, wrongMsg, timeout);
  }

  //====================== Dialog (Advanced receiving) ==========================

  async DialogWaitAnOptionFromList(possibleResults: string[], startMsg: string, errorMsg: string, formatEachElementCallback: (element: string, index: number) => string, timeout?: number,): Promise<string> {
    const possibleResultsRegex = new RegExp(`^(${possibleResults.join("|")})$`)
    let fullMsg: string = errorMsg;
    let optionsTxt: string = possibleResults.map(formatEachElementCallback).join("\n");
    fullMsg += "\n";
    fullMsg += optionsTxt
    await this.bot.Send.Text(this.args.chatId, startMsg + "\n\n" + optionsTxt);
    const toReturn = await WaitTryAndTryUntilGetNextExpectedTxtMsgFromId(this.bot, this.args.chatId, this.args.userId, possibleResultsRegex, fullMsg, timeout);
    return toReturn;
  }

  async DialogWaitAnOptionFromListObj<T>(
    allOptionsObj: T[],
    selectPropCallback: (optionObj: T, index: number) => string,
    startingMsg: string,
    errorMsg: string,
    formatElementCallBack: (element: T, index: number) => string,
    timeout?: number
  ): Promise<T> {
    const selectedProps = allOptionsObj.map(selectPropCallback);
    const selectedByUser = await this.DialogWaitAnOptionFromList(
      selectedProps,
      startingMsg,
      errorMsg,
      (elementStr, index) => formatElementCallBack(allOptionsObj[index], index),
      timeout
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
 * @param participantId  UserId of the participant that sent the message (if it is individual chat, its the same as chatSenderId)
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