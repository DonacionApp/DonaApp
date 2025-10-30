import { Module } from '@nestjs/common';
import { ImagepostController } from './imagepost.controller';
import { ImagepostService } from './imagepost.service';

@Module({
  controllers: [ImagepostController],
  providers: [ImagepostService]
})
export class ImagepostModule {}
