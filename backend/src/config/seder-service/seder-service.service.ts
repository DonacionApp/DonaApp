import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/core/mail/mail.service';
import { RolEntity } from 'src/modules/rol/entity/rol.entity';
import { StatusDonationEntity } from 'src/modules/statusdonation/entity/status.donation.entity';
import { TagsEntity } from 'src/modules/tags/entity/tags.entity';
import { TypeDniEntity } from 'src/modules/typedni/entity/type.dni.entity';
import { TypeMessageEntity } from 'src/modules/typemessage/entity/type.message.entity';
import { TypeNotifyEntity } from 'src/modules/typenotify/entity/type.notify.entity';
import { TypePostEntity } from 'src/modules/typepost/entity/type.port.entity';
import { TypeReportEntity } from 'src/modules/typeReport/entity/type.report.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SederServiceService {
    constructor(
        @InjectRepository(RolEntity)
        private readonly rolRepository: Repository<RolEntity>,
        @InjectRepository(TypeDniEntity)
        private readonly typeDniRepository: Repository<TypeDniEntity>,
        @InjectRepository(TagsEntity)
        private readonly tagsRepository: Repository<TagsEntity>,
        @InjectRepository(StatusDonationEntity)
        private readonly statusDonationRepository: Repository<StatusDonationEntity>,
        @InjectRepository(TypeMessageEntity)
        private readonly typeMessageRepository: Repository<TypeMessageEntity>,
        @InjectRepository(TypeNotifyEntity)
        private readonly typeNotifyRepository: Repository<TypeNotifyEntity>,
        @InjectRepository(TypePostEntity)
        private readonly typePostRepository: Repository<TypePostEntity>,
        @InjectRepository(TypeReportEntity)
        private readonly typeReportRepository: Repository<TypeReportEntity>,
        private readonly mailService: MailService,
    ) { }

    async onModuleInit() {
        const countRol = await this.rolRepository.count();
        if (countRol === 0) {
            await this.rolRepository.save([
                { rol: 'admin' },
                { rol: 'user' },
                { rol: 'organizacion' }
            ]);
            console.log('Roles iniciales creados');
        };

        const countTypeDni = await this.typeDniRepository.count();
        if (countTypeDni === 0) {
            await this.typeDniRepository.save([
                { type: 'NIT' },
                { type: 'CC' }
            ]);
            console.log('Type DNI iniciales creados');
        };

        const countTags = await this.tagsRepository.count();
        if (countTags === 0) {
            await this.tagsRepository.save([
                { tag: 'ropa' },
                { tag: 'alimentos' },
                { tag: 'medicamentos' },
                { tag: 'dinero' },
                { tag: 'electronicos' }
            ]);
            console.log('Tags iniciales creados');
        };

        const countStatusDonation = await this.statusDonationRepository.count();
        if (countStatusDonation === 0) {
            await this.statusDonationRepository.save([
                { status: 'pendiente' },
                { status: 'aceptada' },
                { status: 'rechazada' },
                { status: 'entregada' }
            ]);
            console.log('Status Donation iniciales creados');
        };

        const countTypeMessage = await this.typeMessageRepository.count();
        if (countTypeMessage === 0) {
            await this.typeMessageRepository.save([
                { type: 'texto' },
                { type: 'imagen' },
                { type: 'video' },
                { type: 'audio' },
                { type: 'documento' }
            ]);
            console.log('Type Message iniciales creados');
        };

        const countTypeNotify = await this.typeNotifyRepository.count();
        if (countTypeNotify === 0) {
            await this.typeNotifyRepository.save([
                { type: 'informaacion' },
                { type: 'alerta' },
                { type: 'recordatorio' },
            ]);
            console.log('Type Notify iniciales creados')
        };

        const countTypePost = await this.typePostRepository.count();
        if (countTypePost === 0) {
            await this.typePostRepository.save([
                { type: 'donacion' },
                { type: 'publicacion' },
            ]);
            console.log('typost iniciales creados con exito')
        };

        const countTypeReport = await this.typeReportRepository.count();
        if (countTypeReport === 0) {
            await this.typeReportRepository.save([
                { type: 'solicitud' },
                { type: 'cumplimiento' },
                { type: 'entrega' }
            ])
        }

        const testSendEmailResetPassword = {
            to: 'bailess22@itp.edu.co',
            subject: 'Restablece tu contraseña',
            type: 'reset-password',
            context: {
                user: 'Andrés Iles',
                idUser: 101,
                code: '654321',
                url: 'https://miapp.com/reset-password/101',
            },
        }
        await this.mailService.sendMail(testSendEmailResetPassword);

    }
}
