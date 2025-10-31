import { forwardRef, Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { TagsModule } from '../tags/tags.module';
import { ImagepostModule } from '../imagepost/imagepost.module';
import { PosttagsModule } from '../posttags/posttags.module';
import { TypepostModule } from '../typepost/typepost.module';
import { PostlikedModule } from '../postLiked/postliked.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostEntity]),TagsModule,forwardRef(()=>ImagepostModule),
   forwardRef(()=>PosttagsModule), forwardRef(()=>TypepostModule), forwardRef(()=>PostlikedModule)],
  controllers: [PostController],
  providers: [PostService],
  exports:[PostService]
})
export class PostModule {}
