import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
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
    return !!(mail?.user && mail?.pass && mail?.from);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'El servei de correu no està configurat. Contacta amb l\'administrador.',
      );
    }

    const mail = this.configService.get('mail');
    const transporter = this.getTransporter();

    await transporter.sendMail({
      from: mail.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      attachments: options.attachments,
    });

    this.logger.log(`Correu enviat a ${options.to}: ${options.subject}`);
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
