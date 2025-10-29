import { Module } from '@nestjs/common';
import { PosttagsController } from './posttags.controller';
import { PosttagsService } from './posttags.service';

@Module({
  controllers: [PosttagsController],
  providers: [PosttagsService]
})
export class PosttagsModule {}
