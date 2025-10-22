import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailDto } from './dto/mail.dto';
import { Code } from 'typeorm';
import { TypeSendEmail } from 'src/config/constants';
import { url } from 'inspector';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
    ) { }

    async sendMail(dto: MailDto) {
        try {
            switch (dto.type) {
                case TypeSendEmail.verifyAccount:
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './verify-account',
                        context: {
                            user: dto.context.user,
                            message: dto.context.message,
                            title: dto.context.title,
                            url: dto.context.url,
                            code: dto.context.code,
                            secondaryUrl:dto.context.secondaryUrl ///url para verificar por code
                        }
                    })
                    break;

                case TypeSendEmail.resetPassword:
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './reset-password',
                        context: {
                            user: dto.context.user,
                            url: dto.context.url,
                            code: dto.context.code,
                            message: dto.context.message,
                        },
                    });
                    break;
                case TypeSendEmail.confirmAccount:
                    await this.mailerService.sendMail({
                        to: dto.to,
                        subject: dto.subject,
                        template: './confirm-account',
                        context: {
                            user: dto.context.user,
                            messgae: dto.context.message,
                            title: dto.context.title,
                            url: dto.context.url,
                        }
                    })
                    break;
                case TypeSendEmail.donationUpdate:
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

                case TypeSendEmail.notification:
                case TypeSendEmail.report:
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
