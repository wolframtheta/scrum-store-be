import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const mail = this.configService.get('mail');
    return !!(mail?.user && mail?.pass);
  }

  formatFromAddress(name: string, email: string): string {
    const safeName = name.trim().replace(/"/g, '\\"');
    return `"${safeName}" <${email.trim()}>`;
  }

  formatGroupSender(groupName: string, groupEmail: string): { from: string; replyTo: string } {
    const mail = this.configService.get('mail');
    const senderEmail = mail?.senderEmail?.trim() || groupEmail.trim();
    const displayName = this.resolveFromName(mail?.fromName, groupName);

    return {
      from: this.formatFromAddress(displayName, senderEmail),
      replyTo: groupEmail.trim(),
    };
  }

  private resolveFromName(fromNameTemplate: string | undefined, groupName: string): string {
    const template = fromNameTemplate?.trim();
    if (template) {
      return template.replaceAll('{groupName}', groupName.trim());
    }

    return groupName.trim();
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'El servei de correu no està configurat. Contacta amb l\'administrador.',
      );
    }

    if (!options.from) {
      throw new ServiceUnavailableException(
        'No s\'ha definit el remitent del correu.',
      );
    }

    const transporter = this.getTransporter();

    try {
      const info = await transporter.sendMail({
        from: options.from,
        to: options.to,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      });

      this.logger.log(
        `Correu enviat a ${options.to}: ${options.subject} (id: ${info.messageId})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconegut';
      this.logger.error(`Error SMTP enviant a ${options.to}: ${message}`, error);
      throw new InternalServerErrorException(`No s'ha pogut enviar el correu: ${message}`);
    }
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const mail = this.configService.get('mail');
      this.transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.secure,
        auth: {
          user: mail.user,
          pass: mail.pass,
        },
      });
    }

    return this.transporter;
  }
}
