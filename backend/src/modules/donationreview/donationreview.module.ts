import { Module } from '@nestjs/common';
import { DonationreviewController } from './donationreview.controller';
import { DonationreviewService } from './donationreview.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationReviewEntity } from './entity/donation.review.entity';
import { DonationModule } from '../donation/donation.module';

@Module({
  imports:[TypeOrmModule.forFeature([DonationReviewEntity]), DonationModule],
  controllers: [DonationreviewController],
  providers: [DonationreviewService],
  exports:[DonationreviewService]
})
export class DonationreviewModule {}
