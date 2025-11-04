import { Module } from '@nestjs/common';
import { UserarticleController } from './userarticle.controller';
import { UserarticleService } from './userarticle.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserArticleEntity } from './entity/useraticle.entity';

@Module({
  imports:[TypeOrmModule.forFeature([UserArticleEntity])],
  controllers: [UserarticleController],
  providers: [UserarticleService],
  exports:[UserarticleService],
})
export class UserarticleModule {}
