import { forwardRef, Module } from '@nestjs/common';
import { PostdonationarticleController } from './postdonationarticle.controller';
import { PostdonationarticleService } from './postdonationarticle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostArticleDonationEntity } from './entity/post.article.donation.entity';
import { PostarticleModule } from '../postarticle/postarticle.module';
import { DonationModule } from '../donation/donation.module';
import { StatusdonationModule } from '../statusdonation/statusdonation.module';
import { StatusarticledonationModule } from '../statusarticledonation/statusarticledonation.module';
import { PostModule } from '../post/post.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostArticleDonationEntity]),PostarticleModule, forwardRef(()=>DonationModule),StatusdonationModule,
  forwardRef(() => StatusarticledonationModule),PostModule,
],
  controllers: [PostdonationarticleController],
  providers: [PostdonationarticleService],
  exports:[PostdonationarticleService],
})
export class PostdonationarticleModule {}
