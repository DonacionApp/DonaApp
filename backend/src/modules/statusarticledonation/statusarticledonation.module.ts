import { Module } from '@nestjs/common';
import { StatusarticledonationController } from './statusarticledonation.controller';
import { StatusarticledonationService } from './statusarticledonation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusPostDonationArticle } from './entity/status.postdonationarticle.entity';

@Module({
  imports:[TypeOrmModule.forFeature([StatusPostDonationArticle])],
  controllers: [StatusarticledonationController],
  providers: [StatusarticledonationService],
  exports:[StatusarticledonationService],
})
export class StatusarticledonationModule {}
