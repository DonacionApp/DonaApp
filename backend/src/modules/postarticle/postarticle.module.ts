import { Module } from '@nestjs/common';
import { PostarticleController } from './postarticle.controller';
import { PostarticleService } from './postarticle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostArticleEntity } from './entity/postarticle.entity';
import { PostModule } from '../post/post.module';
import { ArticleModule } from '../article/article.module';

@Module({
  imports:[TypeOrmModule.forFeature([PostArticleEntity]), PostModule, ArticleModule],
  controllers: [PostarticleController],
  providers: [PostarticleService],
  exports: [PostarticleService],
})
export class PostarticleModule {}
