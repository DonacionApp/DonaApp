import { Module } from '@nestjs/common';
import { SederServiceService } from './seder-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from 'src/modules/rol/entity/rol.entity';
import { TypeDniEntity } from 'src/modules/typedni/entity/type.dni.entity';
import { StatusDonationEntity } from 'src/modules/statusdonation/entity/status.donation.entity';
import { TagsEntity } from 'src/modules/tags/entity/tags.entity';
import { TypeMessageEntity } from 'src/modules/typemessage/entity/type.message.entity';
import { TypeNotifyEntity } from 'src/modules/typenotify/entity/type.notify.entity';
import { TypePostEntity } from 'src/modules/typepost/entity/type.port.entity';
import { TypeReportEntity } from 'src/modules/typeReport/entity/type.report.entity';
import { MailModule } from 'src/core/mail/mail.module';
import { ArticleEntity } from 'src/modules/article/entity/article.entity';
import { StatusPostDonationArticle } from 'src/modules/statusarticledonation/entity/status.postdonationarticle.entity';
import { StatusSupportIdEntity } from 'src/modules/statussupportid/entity/status.supportid.entity';
import { systemEntity } from 'src/modules/system/entity/system.entity';

@Module({
  imports:[TypeOrmModule.forFeature([RolEntity,TypeDniEntity,TagsEntity,StatusDonationEntity,
     TypeMessageEntity, TypeNotifyEntity,TypePostEntity,TypeReportEntity, ArticleEntity, StatusPostDonationArticle, StatusSupportIdEntity,
     systemEntity,TypeReportEntity
    ]), MailModule],
  providers: [SederServiceService]
})
export class SederServiceModule {}
