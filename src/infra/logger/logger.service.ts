import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/shared/logger/logger.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService extends AppLogger {
  constructor(private readonly logger: PinoLogger) {
    super();
  }

  info(context: Record<string, unknown>, message: string): void {
    this.logger.info(context, message);
  }

  error(context: Record<string, unknown>, message: string): void {
    this.logger.error(context, message);
  }

  warn(context: Record<string, unknown>, message: string): void {
    this.logger.warn(context, message);
  }

  debug(context: Record<string, unknown>, message: string): void {
    this.logger.debug(context, message);
  }
}
