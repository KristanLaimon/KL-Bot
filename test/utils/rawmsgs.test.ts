import { WAMessage } from '@whiskeysockets/baileys';
import { Msg_DefaultHandleError, Msg_GetTextFromRawMsg } from '../../src/utils/rawmsgs';
import Bot from '../../src/bot';

describe('Getting text content from raw msg', () => {
  it('should return default message when raw message has no message property', () => {
    const rawMsg: Partial<WAMessage> = {};
    expect(Msg_GetTextFromRawMsg(rawMsg as any)).toBe("There's no text in that message");
  });

  it('should return default message when raw message has message property but no conversation or extendedTextMessage properties', () => {
    const rawMsg: Partial<WAMessage> = { message: {} };
    expect(Msg_GetTextFromRawMsg(rawMsg as any)).toBe("There's no text in that message");
  });

  it('should return conversation text when raw message has conversation property', () => {
    const rawMsg: Partial<WAMessage> = { message: { conversation: 'Hello World' } };
    expect(Msg_GetTextFromRawMsg(rawMsg as any)).toBe('Hello World');
  });

  it('should return extendedTextMessage text when raw message has extendedTextMessage property with text property', () => {
    const rawMsg: Partial<WAMessage> = { message: { extendedTextMessage: { text: 'Hello World' } } };
    expect(Msg_GetTextFromRawMsg(rawMsg as any)).toBe('Hello World');
  });

  it('should return default message when raw message has extendedTextMessage property without text property', () => {
    const rawMsg: Partial<WAMessage> = { message: { extendedTextMessage: {} } };
    expect(Msg_GetTextFromRawMsg(rawMsg as any)).toBe("There's no text in that message");
  });
});



describe('Handling default try catch error for commands in general', () => {
  const bot = { Send: { Text: jest.fn() } };
  const chatId = '12345';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send correct message for BotWaitMessageError with wasAbortedByUser true', () => {
    const error = { wasAbortedByUser: true, errorMessage: 'test error' };
    Msg_DefaultHandleError(bot as any, chatId, error);
    expect(bot.Send.Text).toHaveBeenCalledTimes(1);
    expect(bot.Send.Text).toHaveBeenCalledWith(chatId, 'Se ha cancelado el comando...');
  });

  it('should send correct message for BotWaitMessageError with wasAbortedByUser false', () => {
    const error = { wasAbortedByUser: false, errorMessage: 'test error' };
    Msg_DefaultHandleError(bot as any, chatId, error);
    expect(bot.Send.Text).toHaveBeenCalledTimes(1);
    expect(bot.Send.Text).toHaveBeenCalledWith(chatId, 'Te has tardado mucho en contestar...');
  });

  it('should send correct message for non-BotWaitMessageError', () => {
    const error = { message: 'test error' };
    Msg_DefaultHandleError(bot as any, chatId, error);
    expect(bot.Send.Text).toHaveBeenCalledTimes(1);
    expect(bot.Send.Text).toHaveBeenCalledWith(chatId, 'Ocurrio un error al ejecutar el comando... \n' + JSON.stringify(error, null, 4));
  });

  it('should call bot.Send.Text with correct arguments', () => {
    const error = { wasAbortedByUser: true, errorMessage: 'test error' };
    Msg_DefaultHandleError(bot as any, chatId, error);
    expect(bot.Send.Text).toHaveBeenCalledTimes(1);
    expect(bot.Send.Text).toHaveBeenCalledWith(chatId, expect.any(String));
  });
});