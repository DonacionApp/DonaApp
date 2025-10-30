import { Module } from '@nestjs/common';
import { PosttagsController } from './posttags.controller';
import { PosttagsService } from './posttags.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostTagEntity } from './entity/post.tags.entity';
import { TagsModule } from '../tags/tags.module';
import { PostModule } from '../post/post.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostTagEntity]),TagsModule,PostModule],
  controllers: [PosttagsController],
  providers: [PosttagsService],
  exports:[PosttagsService]
})
export class PosttagsModule {}
