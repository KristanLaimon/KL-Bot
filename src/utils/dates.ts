import moment from 'moment';
import { PendingMatch } from '../types/db';
moment.locale('es');

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

export function Dates_GetTimePassedSinceDuelMatchPending(pendingMatch: PendingMatch): string {
  const rawTimePassed = new Date().getTime() - pendingMatch.dateTime;
  const timePassed = moment.duration(rawTimePassed);

  let finalMsg: string[] = [];
  if (timePassed.minutes() != 0) finalMsg.push(timePassed.days() + " minutos");
  if (timePassed.seconds() != 0) finalMsg.push(timePassed.days() === 1 ? timePassed.days() + " segundo" : timePassed.days() + " segundos");

  if (finalMsg.length === 0) finalMsg.push("Esto no debería pasar wtf 🐺🦊");
  return finalMsg.join(", ");
}

export const Dates_SpanishMonthRegex = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/;
export const Dates_SpanishMonthStr = "(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";

/**
 * Get the month number of a simple spanish month
 * @param month Single spanish month like 'enero' or'Enero' it will be normalized anyways
 * @returns The number of the month (NOT ZERO INDEX BASED) or null if its not a month
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




