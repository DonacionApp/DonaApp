import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';

@Module({
  imports:[TypeOrmModule.forFeature([PostEntity])],
  controllers: [PostController],
  providers: [PostService],
  exports:[PostService]
})
export class PostModule {}
