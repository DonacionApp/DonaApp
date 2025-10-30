import { Module } from '@nestjs/common';
import { ImagepostController } from './imagepost.controller';
import { ImagepostService } from './imagepost.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagePostEntity } from './entity/image.post.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ImagePostEntity])],
  controllers: [ImagepostController],
  providers: [ImagepostService],
  exports:[ImagepostService]
})
export class ImagepostModule {}
