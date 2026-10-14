import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { MailService, SendMailInput } from 'src/shared/mail/mail.service';

@Injectable()
export class SmtpMailService extends MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    super();
    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: Number(config.get<string>('SMTP_PORT') ?? 587),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') } : undefined,
    });
    this.from = config.getOrThrow<string>('MAIL_FROM');
  }

  async send({ to, subject, html, text }: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    });
  }
}
