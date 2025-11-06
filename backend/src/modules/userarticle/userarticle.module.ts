import { Module } from '@nestjs/common';
import { UserarticleController } from './userarticle.controller';
import { UserarticleService } from './userarticle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserArticleEntity } from './entity/useraticle.entity';
import { ArticleModule } from '../article/article.module';
import { UserModule } from '../user/user.module';

@Module({
  imports:[TypeOrmModule.forFeature([UserArticleEntity]), ArticleModule,UserModule],
  controllers: [UserarticleController],
  providers: [UserarticleService],
  exports:[UserarticleService],
})
export class UserarticleModule {}
