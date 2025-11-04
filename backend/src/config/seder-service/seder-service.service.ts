import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailDto } from 'src/core/mail/dto/mail.dto';
import { MailService } from 'src/core/mail/mail.service';
import { ArticleEntity } from 'src/modules/article/entity/article.entity';
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
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
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
                { type: 'CC' },
                { type: 'CE' },
                { type: 'PAS' }
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
                { tag: 'electronicos' },
                { tag: 'comidas' }
            ]);
            console.log('Tags iniciales creados');
        };

        const countStatusDonation = await this.statusDonationRepository.count();
        if (countStatusDonation === 0) {
            await this.statusDonationRepository.save([
                { status: 'pendiente' },
                { status: 'aceptada' },
                { status: 'rechazada' },
                { status: 'entregada' },
                { status: 'cancelada' },
                { status: 'en progreso' },
                { status: 'completada' },
                { status: 'recogida '},
                { status: 'en camino' },
                { status: 'en espera' },
                { status: 'recibida' }
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
                { type: 'informacion' },
                { type: 'alerta' },
                { type: 'recordatorio' },
            ]);
            console.log('Type Notify iniciales creados')
        };

        const countTypePost = await this.typePostRepository.count();
        if (countTypePost === 0) {
            await this.typePostRepository.save([
                { type: 'donacion completada' },
                { type: 'publicacion' },
                { type: 'solicitud de donacion'},
                { type: 'articulos para donar'}
            ]);
            console.log('typost iniciales creados con exito')
        };

        const countTypeReport = await this.typeReportRepository.count();
        if (countTypeReport === 0) {
            await this.typeReportRepository.save([
                { type: 'solicitud' },
                { type: 'cumplimiento' },
                { type: 'entrega' },
                { type: 'usuario' },
                { type: 'publicacion' }
            ])
        }

        const counArticle = await this.articleRepository.count();
        if (counArticle === 0) {
            await this.articleRepository.save([
                {name: 'camiseta',descripcion: 'camiseta de algodon talla m'},
                {name: 'pantalon',descripcion: 'pantalon jean talla 32'},
                {name: 'zapatos',descripcion: 'zapatos deportivos talla 42'},
                {name: 'paracetamol 500mg',descripcion: 'medicamento para aliviar el dolor y la fiebre'},
                {name: 'ibuprofeno 400mg',descripcion: 'medicamento antiinflamatorio y analgésico'},
                {name: 'amoxicilina 250mg',descripcion: 'antibiótico para tratar infecciones bacterianas'},
                {name: 'arroz 1kg',descripcion: 'bolsa de arroz blanco de 1 kilogramo'},
                {name: 'frijoles 1kg',descripcion: 'bolsa de frijoles negros de 1 kilogramo'}
                
            ])
        }


    }
}
