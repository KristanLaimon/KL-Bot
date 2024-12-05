import moment from 'moment';
moment.locale('es');

export function GetFormatedDurationDaysSince(pastDate: bigint | number) {
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



