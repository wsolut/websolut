import {
  Injectable,
  LoggerService as NestJsLoggerService,
} from '@nestjs/common';
import { createLogger, format, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestJsLoggerService {
  private readonly logger: Logger;

  constructor(destinationPath: string) {
    this.logger = createLogger({
      level: 'info', // Set desired log level
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
          const { timestamp, level, message } = info;
          return `${String(timestamp)} [${String(level).toUpperCase()}]: ${String(message)}`;
        }),
      ),
      transports: [
        new DailyRotateFile({
          dirname: destinationPath,
          filename: 'backend-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(message, { trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
