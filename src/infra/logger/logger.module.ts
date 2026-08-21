import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppLogger } from 'src/shared/logger/logger.service';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
  ],
  controllers: [],
  providers: [
    LoggerService,
    {
      provide: AppLogger,
      useClass: LoggerService,
    },
  ],
  exports: [AppLogger],
})
export class LoggerModule {}
