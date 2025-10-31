import { Module } from '@nestjs/common';
import { StatusdonationController } from './statusdonation.controller';
import { StatusdonationService } from './statusdonation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusDonationEntity } from './entity/status.donation.entity';

@Module({
  imports:[TypeOrmModule.forFeature([StatusDonationEntity])],
  controllers: [StatusdonationController],
  providers: [StatusdonationService],
  exports: [StatusdonationService],
})
export class StatusdonationModule {}
