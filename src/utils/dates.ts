import moment, { Moment } from 'moment';
import { PendingMatch } from '../types/db';
import KlLogger from '../bot/logger';
moment.locale('es');

/**
 * A string with all the months in spanish separated by a pipe, so it can be used in a regex.
 * @example
 * const date1 = "2022/enero/25";
 * const date2 = " 2022/febrero/28  ";
 * const date3 = "foo/bar/123";
 * console.log(new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/\\d{1,2}\\s*$`, "i").test(date1)); // true
 * console.log(new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/\\d{1,2}\\s*$`, "i").test(date2)); // true
 * console.log(new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/\\d{1,2}\\s*$`, "i").test(date3)); // false
 */
export const Dates_SpanishMonthStr = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
export const Dates_SpanishMonthRegex = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/;

/**
 * A regex that matches a date in the format "YYYY/MM/DD" or "YYYY/mm/dd" where MM is a month in spanish.
 * @example
 * const date1 = "2022/enero/25";
 * const date2 = " 2022/febrero/28  ";
 * const date3 = "foo/bar/123";
 * console.log(Dates_DateInputRegex.test(date1)); // true
 * console.log(Dates_DateInputRegex.test(date2)); // true
 * console.log(Dates_DateInputRegex.test(date3)); // false
 */
export const Dates_DateInputRegex = new RegExp(`^\\s*\\d{4}\\/${Dates_SpanishMonthStr}\\/(0?[1-9]|[12][0-9]|3[01])\\s*$`, "i");

export const Dates_HoursStr = "(2[0-3]|1[0-9]|0?[0-9])";
export const Dates_MinutesStr = "([012345][0-9])";
export const Dates_SecondsStr = "([12345][0-9]|[0-9])";
export const Dates_12HrsInputRegex = new RegExp(`^${Dates_HoursStr}:${Dates_MinutesStr} ?(AM|PM)$`, "i")



/**
 * Adds a given 12-hour time to a moment object, returning a new moment object with the resulting time.
 * The 12-hour time is expected to be in the format 'HH:MM AM/PM'.
 * @param momentObj The moment object to add the time to.
 * @param TwelveHrsTimeStr The 12-hour time to add, in the format 'HH:MM AM/PM'.
 * @returns A new moment object with the resulting time.
 * @throws Will throw an error if the given 12-hour time does not match the expected format.
 */
export function Dates_Add12hrsTimeToMomentObj(momentObj: Moment, TwelveHrsTimeStr: string): boolean {
  if (!Dates_12HrsInputRegex.test(TwelveHrsTimeStr)) return false;
  const numbers = TwelveHrsTimeStr.match(/\d+/g);
  let hours = parseInt(numbers[0]!);
  let minutes = parseInt(numbers[1]!);

  if (hours === 12) {
    if (TwelveHrsTimeStr.includes('PM')) hours = 12;
    else hours = 0;
  } else {
    if (TwelveHrsTimeStr.includes('PM')) hours += 12;
  }
  (momentObj).add(hours, 'hours').add(minutes, 'minutes');
  return true;
}

/**
 * Given a date in the past, returns a string with a human-readable representation of how much time has passed since then.
 * @param pastDate The date in the past to calculate the time passed since.
 * @returns A string with the time passed since the given date, e.g.:
 * - "3 años, 2 meses y 5 días".
 * - "1 mes y 2 días".
 * - "Se unió el día de hoy".
 * - "X horas, Y minutos y Z segundos".
 */
export function Dates_GetFormatedDurationDaysSince(pastDate: bigint | number) {
  const pastTime = moment(Number(pastDate));
  const now = moment();

  if (pastTime.isAfter(now))
    throw new Error("For some reason, GetFormatedDuration has got a future date!");

  const timePassed = moment.duration(now.diff(pastTime));
  let finalMsg: string[] = [];
  if (timePassed.years() != 0) finalMsg.push(timePassed.years() + " años");
  if (timePassed.months() != 0) finalMsg.push(timePassed.months() + " meses");
  if (timePassed.days() != 0) finalMsg.push(timePassed.days() + " días");

  if (finalMsg.length === 0) finalMsg.push("Se unió el día de hoy");
  return finalMsg.join(", ");
}

/**
 * Calculates and returns a human-readable string representing the time passed since a pending match was requested.
 * 
 * @param pendingMatch - The pending match object containing the initial match request time.
 * @returns A string detailing the time elapsed since the match was requested, e.g., "3 minutos, 2 segundos".
 * 
 * @example
 * const pendingMatch = { dateTime: new Date().getTime() - 3 * 60 * 1000 - 2 * 1000 };
 * console.log(Dates_GetTimePassedSinceDuelMatchPending(pendingMatch)); // "3 minutos, 2 segundos"
 * 
 * @example
 * const pendingMatch = { dateTime: new Date().getTime() - 45 * 1000 };
 * console.log(Dates_GetTimePassedSinceDuelMatchPending(pendingMatch)); // "45 segundos"
 * 
 * @throws Will throw an error if the match dateTime is set in the future.
 */
export function Dates_GetTimePassedSinceDuelMatchPending(pendingMatch: PendingMatch): string {
  const rawTimePassed = new Date().getTime() - pendingMatch.dateTime;
  if (Math.sign(rawTimePassed) === -1) throw Error('For some reason, GetTimePassedSinceDuelMatchPending has got a future date!');
  const timePassed = moment.duration(rawTimePassed);

  let finalMsg: string[] = [];
  if (timePassed.minutes() != 0) finalMsg.push(timePassed.minutes() + " minutos");
  if (timePassed.seconds() != 0) finalMsg.push(timePassed.seconds() === 1 ? timePassed.seconds() + " segundo" : timePassed.seconds() + " segundos");

  if (finalMsg.length === 0) finalMsg.push("Esto no debería pasar wtf 🐺🦊");
  return finalMsg.join(", ");
}

/**
 * Converts a string with a date in the format "YYYY/MMMM/DD" or "YYYY/MMMM/dd" to a Moment object.
 * The month MMMM must be a month in spanish (e.g. "enero", "febrero", etc.). And returns the moment
 * object within 0 hours.
 * @param alreadyFormattedDate The string with the date to be converted.
 * @returns A Moment object with the parsed date.
 * @throws {Error} If the input string does not match the expected format.
 * @example
 * const date1 = "2022/enero/25";
 * const date2 = " 2022/febrero/28  ";
 * const date3 = "foo/bar/123";
 * console.log(Dates_ConvertDateInputToMomentJs(date1).format()); // "2022-01-25T00:00:00.000Z"
 * console.log(Dates_ConvertDateInputToMomentJs(date2).format()); // "2022-02-28T00:00:00.000Z"
 * console.log(() => Dates_ConvertDateInputToMomentJs(date3)); // throws
 */
export function Dates_ConvertDateInputToMomentJs(alreadyFormattedDate: string): Moment {
  if (!Dates_DateInputRegex.test(alreadyFormattedDate)) {
    throw new Error('Invalid date input format. Expected "YYYY/MMMM/DD" or "YYYY/MMMM/dd", ' +
      'for example "2022/enero/25" or "2022/ENERO/25". Received: ' + alreadyFormattedDate);
  };

  const dateInputPartes = alreadyFormattedDate.trim().split('/');
  const monthNumber = Dates_SpanishMonthToNumber(dateInputPartes.at(1)!)!;
  const dateParsed = alreadyFormattedDate.replace(dateInputPartes.at(1)!, monthNumber.toString());
  return moment(dateParsed);
}

/**
 * Converts a Spanish month name to its corresponding month number.
 * 
 * @param month - A single Spanish month name, e.g., 'enero' or 'Enero'. 
 * The input will be normalized to ensure case-insensitive matching.
 * 
 * @returns The number of the month (1-based, not zero-indexed), or null if the input is not a valid month.
 * 
 * @example
 * Dates_SpanishMonthToNumber('enero'); // returns 1
 * Dates_SpanishMonthToNumber('Febrero'); // returns 2
 * Dates_SpanishMonthToNumber('invalid'); // returns null
 */
export function Dates_SpanishMonthToNumber(month: string): number | null {
  const months: { [key: string]: number } = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  // Normalize the input to lowercase for case-insensitive matching
  const normalizedMonth = month.trim().toLowerCase();
  return months[normalizedMonth] || null; // Return null if the month is invalid
}




