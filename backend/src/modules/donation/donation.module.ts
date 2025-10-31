import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationEntity } from './entity/donation.entity';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { UserModule } from '../user/user.module';
import { StatusdonationModule } from '../statusdonation/statusdonation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DonationEntity,
    ]),
    UserModule,
    StatusdonationModule
  ],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
