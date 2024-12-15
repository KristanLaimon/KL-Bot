import winston from 'winston';
import { format } from 'date-fns'; // Use date-fns for timestamp formatting

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(), // Keep the default timestamp
    winston.format.printf(({ level, message, timestamp }) => {
      const humanTimestamp = format(new Date(timestamp as string), 'EEEE dd MMMM h:mm aa');
      return `${humanTimestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    // Logs all warnings and above to `warnings.log`
    new winston.transports.File({ filename: 'logs/warnings_errors.log', level: 'warn' }),

    // Logs all messages to `all.log`
    new winston.transports.File({ filename: 'logs/all.log' }),

    // Logs to the console
    new winston.transports.Console(),
  ],
});
