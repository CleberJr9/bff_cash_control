import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from 'src/shared/mail/mail.service';
import { SmtpMailService } from './smtp-mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MailService,
      useClass: SmtpMailService,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
