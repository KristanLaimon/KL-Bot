import moment from 'moment';
import { Dates_Add12hrsTimeToMomentObj, Dates_GetFormatedDurationTimeFrom, Dates_GetTimePassedSinceDuelMatchPending, Dates_SpanishMonthToNumber } from '../../src/utils/dates';
import { Dates_12HrsInputRegex } from '../../src/utils/dates';

describe('Getting formated duration days since a date in spanish', () => {
  it('should return a string with the time passed since a date in the past', () => {
    const pastDate = moment().subtract(1, 'year').valueOf();
    const result = Dates_GetFormatedDurationTimeFrom(pastDate);
    expect(result).toContain('año');
  });

  it('should throw an error with a date in the future', () => {
    const futureDate = moment().add(1, 'day').valueOf();
    expect(() => Dates_GetFormatedDurationTimeFrom(futureDate)).toThrow('For some reason, GetFormatedDuration has got a future date!');
  });

  it('should return "Se unió el día de hoy" with a date that is the same as the current date', () => {
    const currentDate = moment().valueOf();
    const result = Dates_GetFormatedDurationTimeFrom(currentDate);
    expect(result).toBe('Se unió el día de hoy');
  });

  it('should return a string with the time passed since a date that is one day in the past', () => {
    const pastDate = moment().subtract(1, 'day').valueOf();
    const result = Dates_GetFormatedDurationTimeFrom(pastDate);
    expect(result).toContain('día');
  });

  it('should return a string with the time passed since a date that is one month in the past', () => {
    const pastDate = moment().subtract(1, 'month').subtract(4, 'day').valueOf();
    const result = Dates_GetFormatedDurationTimeFrom(pastDate);
    expect(result).toContain('mes');
  });

  it('should return a string with the time passed since a date that is one year in the past', () => {
    const pastDate = moment().subtract(1, 'year').valueOf();
    const result = Dates_GetFormatedDurationTimeFrom(pastDate);
    expect(result).toContain('año');
  });
});

describe('Getting formated duration time from last match pending', () => {
  it('should return a string with minutes and seconds', () => {
    const pendingMatch = { dateTime: new Date().getTime() - 3 * 60 * 1000 - 2 * 1000 };
    const result = Dates_GetTimePassedSinceDuelMatchPending(pendingMatch as any);
    expect(result).toBe('3 minutos, 2 segundos');
  });
  it('should return a string with only seconds', () => {
    const pendingMatch = { dateTime: new Date().getTime() - 2 * 1000 };
    const result = Dates_GetTimePassedSinceDuelMatchPending(pendingMatch as any);
    expect(result).toBe('2 segundos');
  });
  it('should not throw an error when the pending match was requested in the future', () => {
    const pendingMatch = { dateTime: new Date().getTime() + 10 * 1000 };
    expect(() => {
      const result = Dates_GetTimePassedSinceDuelMatchPending(pendingMatch as any);
    }).toThrow('For some reason, GetTimePassedSinceDuelMatchPending has got a future date!')
  });
});

describe('Getting the number of a spanish month', () => {
  it('should return the correct month number for valid month names', () => {
    expect(Dates_SpanishMonthToNumber('enero')).toBe(1);
    expect(Dates_SpanishMonthToNumber('Enero')).toBe(1);
    expect(Dates_SpanishMonthToNumber('febrero')).toBe(2);
    expect(Dates_SpanishMonthToNumber('diciembre')).toBe(12);
  });
  it('should return null for invalid month names', () => {
    expect(Dates_SpanishMonthToNumber('invalid')).toBeNull();
    expect(Dates_SpanishMonthToNumber('foo')).toBeNull();
  });
  it('should return the correct month number for month names with extra whitespace', () => {
    expect(Dates_SpanishMonthToNumber(' enero ')).toBe(1);
    expect(Dates_SpanishMonthToNumber('  febrero  ')).toBe(2);
  });
  it('should return null for empty string input', () => {
    expect(Dates_SpanishMonthToNumber('')).toBeNull();
  });
});


describe('Validating 12-hour time input', () => {
  it('should match a time in 12 hour format', () => {
    const input = '10:30 AM';
    const result = input.match(Dates_12HrsInputRegex);
    expect(result).not.toBeNull();
    expect(result[0]).toBe('10:30 AM');

  });

  it('should not match an invalid time', () => {
    const input = '25:67';
    const result = input.match(Dates_12HrsInputRegex);
    expect(result).toBeNull();
  });

  it('should not match a string that is not a time', () => {
    const input = 'hola mundo';
    const result = input.match(Dates_12HrsInputRegex);
    expect(result).toBeNull();
  });
});


describe('Add12hrsTimeToMomentObj', () => {
  it('should add valid 12-hour time to moment object', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '08:30 AM';
    const rusult = Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr);
    expect(rusult).toBe(true);
    expect(momentObj.format('HH:mm')).toBe('08:30');
  });

  it('should give false for invalid 12-hour time format', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '08:30';
    expect(Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr)).toBe(false);
  });

  it('should convert AM to 24-hour format', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '08:30 AM';
    const result = Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr);
    expect(result).toBe(true);
    expect(momentObj.format('HH:mm')).toBe('08:30');
  });

  it('should convert PM to 24-hour format', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '08:30 PM';
    const result = Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr);
    expect(result).toBe(true);
    expect(momentObj.format('HH:mm')).toBe('20:30');
  });

  it('should handle edge case 12:00 AM', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '12:00 AM';
    const result = Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr);
    expect(result).toBe(true);
    expect(momentObj.format('HH:mm')).toBe('00:00');
  });

  it('should handle edge case 12:00 PM', () => {
    const momentObj = moment('2022-01-01 00:00:00');
    const twelveHrsTimeStr = '12:00 PM';
    const result = Dates_Add12hrsTimeToMomentObj(momentObj, twelveHrsTimeStr);
    expect(result).toBe(true);
    expect(momentObj.format('HH:mm')).toBe('12:00');
  });
});