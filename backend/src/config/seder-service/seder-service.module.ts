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

@Module({
  imports:[TypeOrmModule.forFeature([RolEntity,TypeDniEntity,TagsEntity,StatusDonationEntity, TypeMessageEntity, TypeNotifyEntity,TypePostEntity,TypeReportEntity,]), MailModule],
  providers: [SederServiceService]
})
export class SederServiceModule {}
