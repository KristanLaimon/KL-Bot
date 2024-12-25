import { Phone_GetFullPhoneInfoFromRawmsg, Phone_GetPhoneNumberFromMention, Phone_IsAMentionNumber } from '../../src/utils/phonenumbers';
import { WAMessage } from '@whiskeysockets/baileys';

describe('Getting full phone info from raw msg', () => {
  it('should return full phone info for a valid private message', () => {
    const rawMsg: WAMessage = {
      key: {
        participant: '1234567890123@s.whatsapp.net',
      },
    };
    const result = Phone_GetFullPhoneInfoFromRawmsg(rawMsg);
    expect(result).toEqual({
      countryCode: '123',
      number: '1234567890123',
      numberWithNoCountryCode: '4567890123',
      whatsappId: '4567890123@s.whatsapp.net',
    });
  });

  it('should throw an error for an invalid message', () => {
    const rawMsg: WAMessage = {
      key: {},
    };
    expect(() => Phone_GetFullPhoneInfoFromRawmsg(rawMsg)).toThrow(
      'This shouln\'t happen, library never gives both participant and remoteJid as undefined, only one of them'
    );
  });

  it('should throw an error for an invalid phone number', () => {
    const rawMsg: WAMessage = {
      key: {
        participant: ' invalid phone number',
      },
    };
    expect(() => Phone_GetFullPhoneInfoFromRawmsg(rawMsg)).toThrowError(
      '???, Phone number must be alway valid, just a small validation'
    );
  });

  it('should throw an error for a phone number that does not contain "@"', () => {
    const rawMsg: WAMessage = {
      key: {
        participant: '1234567890234',
      },
    };
    expect(() => Phone_GetFullPhoneInfoFromRawmsg(rawMsg)).toThrowError(
      '???, Phone number must be alway valid, just a small validation'
    );
  });
});

describe('Getting full phone info from mention msg "@1234567890123 e.g"', () => {
  it('returns null for invalid phone number mention', () => {
    const invalidMention = '@1234567890';
    expect(Phone_GetPhoneNumberFromMention(invalidMention)).toBeNull();
  });
  it('returns null for null input', () => {
    expect(Phone_GetPhoneNumberFromMention(null)).toBeNull();
  });
  it('returns null for empty string input', () => {
    expect(Phone_GetPhoneNumberFromMention('')).toBeNull();
  });
  it('returns valid phone number object for valid phone number mention', () => {
    const validMention = '@1234567890123';
    const expectedNumber = {
      countryCode: '123',
      number: '1234567890123',
      numberWithNoCountryCode: '4567890123',
      whatsappId: '1234567890123@s.whatsapp.net',
    };
    expect(Phone_GetPhoneNumberFromMention(validMention)).toEqual(expectedNumber);
  });
  it('returns valid phone number object for phone number mention with country code', () => {
    const validMention = '@1234567890123';
    const expectedNumber = {
      countryCode: '123',
      number: '1234567890123',
      numberWithNoCountryCode: '4567890123',
      whatsappId: '1234567890123@s.whatsapp.net',
    };
    expect(Phone_GetPhoneNumberFromMention(validMention)).toEqual(expectedNumber);
  });
});

describe('Checking if a string is a mention number', () => {
  it('should return true for a valid mention number', () => {
    const mentionStr = '@1234567890123';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(true);
  });
  it('should return false for a mention number with less than 13 digits', () => {
    const mentionStr = '@123456789012';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for a mention number with more than 13 digits', () => {
    const mentionStr = '@12345678901234';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for a mention number with non-digit characters', () => {
    const mentionStr = '@abcdefghijklm';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for a non-mention string', () => {
    const mentionStr = '1234567890123';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for an empty string', () => {
    const mentionStr = '';
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for a null input', () => {
    const mentionStr = null;
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
  it('should return false for an undefined input', () => {
    const mentionStr = undefined;
    expect(Phone_IsAMentionNumber(mentionStr)).toBe(false);
  });
});