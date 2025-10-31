import { Module } from '@nestjs/common';
import { PostlikedController } from '../postLiked/postliked.controller';
import { PostlikedService } from '../postLiked/postliked.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLikedEntity } from './entity/post.liked.entity';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostLikedEntity]),PostModule,UserModule],
  controllers: [PostlikedController],
  providers: [PostlikedService],
  exports:[PostlikedService]
})
export class PostlikedModule {}
