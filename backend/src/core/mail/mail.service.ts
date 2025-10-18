import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailDto } from './dto/mail.dto';
import { Code } from 'typeorm';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
    ) { }

    async sendMail(dto: MailDto) {
        try {
            switch (dto.type) {
                case 'confirm-account':
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './confirm-account',
                        context: {
                            user: dto.context.user,
                            message: dto.context.message,
                            title: dto.context.title,
                        }
                    })
                    break;

                case 'reset-password':
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './reset-password',
                        context: {
                            user: dto.context.user,
                            idUser: dto.context.idUser,
                            url: dto.context.url,
                            code: dto.context.code
                        },
                    });
                    break;

                case 'donation-update':
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject:  dto.subject,
                        template: './donation-update',
                        context: {
                            user: dto.context.user,
                            status: dto.context.status, // puede ser: 'Pendiente', 'En proceso', 'En camino', 'Completada'
                            message: dto.context.message,
                            showTimeline: true,
                        }
                    })
                    break;

                case 'notification':
                case 'report':
                default:
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './notify',
                        context: {
                            user: dto.context.user,
                            message: dto.context.message,
                        }
                    })

                    break
            }
        } catch (error) {
            throw error;
        }
    }
}
