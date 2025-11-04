import { Module } from '@nestjs/common';
import { PostdonationarticleController } from './postdonationarticle.controller';
import { PostdonationarticleService } from './postdonationarticle.service';

@Module({
  controllers: [PostdonationarticleController],
  providers: [PostdonationarticleService]
})
export class PostdonationarticleModule {}
