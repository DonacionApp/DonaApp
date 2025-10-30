import { forwardRef, Module } from '@nestjs/common';
import { ImagepostController } from './imagepost.controller';
import { ImagepostService } from './imagepost.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagePostEntity } from './entity/image.post.entity';
import { PostModule } from '../post/post.module';

@Module({
  imports:[TypeOrmModule.forFeature([ImagePostEntity]),forwardRef(()=>PostModule) ],
  controllers: [ImagepostController],
  providers: [ImagepostService],
  exports:[ImagepostService]
})
export class ImagepostModule {}
