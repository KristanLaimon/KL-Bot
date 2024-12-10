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



