import { Module } from '@nestjs/common';
import { PostdonationarticleController } from './postdonationarticle.controller';
import { PostdonationarticleService } from './postdonationarticle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostArticleDonationEntity } from './entity/post.article.donation.entity';
import { PostModule } from '../post/post.module';
import { PostarticleModule } from '../postarticle/postarticle.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostArticleDonationEntity]), PostModule,PostarticleModule],
  controllers: [PostdonationarticleController],
  providers: [PostdonationarticleService],
  exports:[PostdonationarticleService],
})
export class PostdonationarticleModule {}
