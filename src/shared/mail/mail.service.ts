export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export abstract class MailService {
  abstract send(input: SendMailInput): Promise<void>;
}
