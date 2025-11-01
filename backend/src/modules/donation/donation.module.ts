import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationEntity } from './entity/donation.entity';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { UserModule } from '../user/user.module';
import { StatusdonationModule } from '../statusdonation/statusdonation.module';
import { StatusDonationEntity } from '../statusdonation/entity/status.donation.entity';
import { NotifyEntity } from '../notify/entity/notify.entity';
import { TypeNotifyEntity } from '../typenotify/entity/type.notify.entity';
import { UserNotifyEntity } from '../userNotify/entity/user.notify.entity';
import { AuditEntity } from '../audit/entity/audit.entity';
import { UserEntity } from '../user/entity/user.entity';
import { EventsModule } from 'src/core/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DonationEntity,
      StatusDonationEntity,
      NotifyEntity,
      TypeNotifyEntity,
      UserNotifyEntity,
      AuditEntity,
      UserEntity,
    ]),
    UserModule,
    StatusdonationModule,
    EventsModule,
  ],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
