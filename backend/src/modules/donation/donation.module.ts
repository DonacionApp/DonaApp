import { forwardRef, Module } from '@nestjs/common';
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
import { PostdonationarticleModule } from '../postdonationarticle/postdonationarticle.module';
import { PostarticleModule } from '../postarticle/postarticle.module';
import { PostModule } from '../post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DonationEntity,
    ]),
    forwardRef(() => UserModule),
    StatusdonationModule,
    EventsModule,
    forwardRef(()=>PostdonationarticleModule),
    PostarticleModule,
    PostModule,
  ],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule { }
