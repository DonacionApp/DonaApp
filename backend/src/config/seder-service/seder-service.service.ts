import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailDto } from 'src/core/mail/dto/mail.dto';
import { MailService } from 'src/core/mail/mail.service';
import { ArticleEntity } from 'src/modules/article/entity/article.entity';
import { RolEntity } from 'src/modules/rol/entity/rol.entity';
import { StatusPostDonationArticle } from 'src/modules/statusarticledonation/entity/status.postdonationarticle.entity';
import { StatusDonationEntity } from 'src/modules/statusdonation/entity/status.donation.entity';
import { StatusSupportIdEntity } from 'src/modules/statussupportid/entity/status.supportid.entity';
import { systemEntity } from 'src/modules/system/entity/system.entity';
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
        @InjectRepository(StatusPostDonationArticle)
        private readonly statusPostDonationArticleRepository: Repository<StatusPostDonationArticle>,
        @InjectRepository(StatusSupportIdEntity)
        private readonly statusSupportIdRepository: Repository<StatusSupportIdEntity>,
        @InjectRepository(systemEntity)        
        private readonly systemRepository: Repository<systemEntity>
    ) { }

    async onModuleInit() {
        const countSystem = await this.systemRepository.count();
        if (countSystem === 0) {
            const system = this.systemRepository.create({
                privacyPolicy: 'Política de privacidad inicial',
                termsAndConditions: 'Términos y condiciones iniciales',
                aboutUs: 'Acerca de nosotros inicial'
            });
            await this.systemRepository.save(system);
            console.log('System inicial creado');
        }
        const countRol = await this.rolRepository.count();
        const rol = [
            { rol: 'admin' },
            { rol: 'user' },
            { rol: 'organizacion' }
        ];
        if (countRol < rol.length) {
            for (const r of rol) {
                const exists = await this.rolRepository.findOneBy({ rol: r.rol });
                if (!exists) {
                    await this.rolRepository.save(r);
                }
            }
            console.log('Roles iniciales creados');
        };

        const countTypeDni = await this.typeDniRepository.count();
        const typeDni = [
            { type: 'NIT' },
            { type: 'CC' },
            { type: 'CE' },
            { type: 'PAS' }
        ]
        if (countTypeDni < typeDni.length) {
            for (const t of typeDni) {
                const exists = await this.typeDniRepository.findOneBy({ type: t.type });
                if (!exists) {
                    await this.typeDniRepository.save(t);
                }
            }
            console.log('Type DNI iniciales creados');
        };

        const countTags = await this.tagsRepository.count();
        const tags = [
            { tag: 'ropa' },
            { tag: 'alimentos' },
            { tag: 'medicamentos' },
            { tag: 'dinero' },
            { tag: 'electronicos' },
            { tag: 'comidas' }
        ]
        if (countTags < tags.length) {
            for (const t of tags) {
                const exists = await this.tagsRepository.findOneBy({ tag: t.tag });
                if (!exists) {
                    await this.tagsRepository.save(t);
                }
            }
            console.log('Tags iniciales creados');
        };

        const countStatusDonation = await this.statusDonationRepository.count();
        const statusDonation = [
            { status: 'pendiente' },
            { status: 'aceptada' },
            { status: 'rechazada' },
            { status: 'entregada' },
            { status: 'cancelada' },
            { status: 'en progreso' },
            { status: 'completada' },
            { status: 'recogida ' },
            { status: 'en camino' },
            { status: 'en espera' },
            { status: 'recibida' }
        ]
        if (countStatusDonation < statusDonation.length) {
            for (const s of statusDonation) {
                const exists = await this.statusDonationRepository.findOneBy({ status: s.status });
                if (!exists) {
                    await this.statusDonationRepository.save(s);
                }
            }
            console.log('Status Donation iniciales creados');
        };

        const countTypeMessage = await this.typeMessageRepository.count();
        const typeMessage = [
            { type: 'texto' },
            { type: 'imagen' },
            { type: 'video' },
            { type: 'audio' },
            { type: 'documento' }
        ]
        if (countTypeMessage < typeMessage.length) {
            for (const t of typeMessage) {
                const exists = await this.typeMessageRepository.findOneBy({ type: t.type });
                if (!exists) {
                    await this.typeMessageRepository.save(t);
                }
            }
            console.log('Type Message iniciales creados');
        };

        const countTypeNotify = await this.typeNotifyRepository.count();
        const typenotify = [
            { type: 'informaacion' },
            { type: 'alerta' },
            { type: 'recordatorio' },
        ]
        if (countTypeNotify < typenotify.length) {
            for (const t of typenotify) {
                const exists = await this.typeNotifyRepository.findOneBy({ type: t.type });
                if (!exists) {
                    await this.typeNotifyRepository.save(t);
                }
            }
            console.log('Type Notify iniciales creados');
        };

        const countTypePost = await this.typePostRepository.count();
        const typePost = [
            { type: 'donacion completada' },
            { type: 'publicacion' },
            { type: 'solicitud de donacion' },
            { type: 'articulos para donar' }
        ]
        if (countTypePost < typePost.length) {
            for (const t of typePost) {
                const exists = await this.typePostRepository.findOneBy({ type: t.type });
                if (!exists) {
                    await this.typePostRepository.save(t);
                }
            }
            console.log('Type Post iniciales creados');
        };

        const countTypeReport = await this.typeReportRepository.count();
        const typeReport = [
            { type: 'solicitud' },
            { type: 'cumplimiento' },
            { type: 'entrega' },
            { type: 'usuario' },
            { type: 'publicacion' }
        ]
        if (countTypeReport < typeReport.length) {
            for (const t of typeReport) {
                const exists = await this.typeReportRepository.findOneBy({ type: t.type });
                if (!exists) {
                    await this.typeReportRepository.save(t);
                }
            }
            console.log('Type Report iniciales creados');
        }

        const counArticle = await this.articleRepository.count();
        const articles=[
                { name: 'camiseta', descripcion: 'camiseta de algodon talla m' },
                { name: 'pantalon', descripcion: 'pantalon jean talla 32' },
                { name: 'zapatos', descripcion: 'zapatos deportivos talla 42' },
                { name: 'paracetamol 500mg', descripcion: 'medicamento para aliviar el dolor y la fiebre' },
                { name: 'ibuprofeno 400mg', descripcion: 'medicamento antiinflamatorio y analgésico' },
                { name: 'amoxicilina 250mg', descripcion: 'antibiótico para tratar infecciones bacterianas' },
                { name: 'arroz 1kg', descripcion: 'bolsa de arroz blanco de 1 kilogramo' },
                { name: 'frijoles 1kg', descripcion: 'bolsa de frijoles negros de 1 kilogramo' }

            ]
        if (counArticle <articles.length) {
            for (const article of articles) {
                const exists = await this.articleRepository.findOneBy({ name: article.name });
                if (!exists) {
                    await this.articleRepository.save(article);
                }
            }
            console.log('Artículos iniciales creados');
        }

        const countStatusDonationArticle = await this.statusPostDonationArticleRepository.count();
        const statusDonationArticles = [
                { status: 'disponible' },
                { status: 'no disponible' },
            ]
        if (countStatusDonationArticle <statusDonationArticles.length) {
            for (const status of statusDonationArticles) {
                const exists = await this.statusPostDonationArticleRepository.findOneBy({ status: status.status });
                if (!exists) {
                    await this.statusPostDonationArticleRepository.save(status);
                }
            }
            console.log('Status Donation Article iniciales creados');
        }

        const countStatusSupportId = await this.statusSupportIdRepository.count();
        const statusSupportIds = [
                { name: 'aceptado' },
                { name: 'rechazado' },
            ]
        if (countStatusSupportId <statusSupportIds.length) {
            for (const status of statusSupportIds) {
                const exists = await this.statusSupportIdRepository.findOneBy({ name: status.name });
                if (!exists) {
                    await this.statusSupportIdRepository.save(status);
                }
            }
            console.log('Status Support ID iniciales creados');
        }

    }
}
