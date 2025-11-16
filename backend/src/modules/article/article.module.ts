import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './entity/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity]), forwardRef(()=>ArticleModule), forwardRef(()=>AuditModule)],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports:[ArticleService]
})
export class ArticleModule {}
