import { Module } from '@nestjs/common';
import { PostlikedController } from '../postLiked/postliked.controller';
import { PostlikedService } from '../postLiked/postliked.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLikedEntity } from './entity/post.liked.entity';
import { PostModule } from '../post/post.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostLikedEntity]),PostModule],
  controllers: [PostlikedController],
  providers: [PostlikedService],
  exports:[PostlikedService]
})
export class PostlikedModule {}
