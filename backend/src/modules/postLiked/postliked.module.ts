import { Module } from '@nestjs/common';
import { PostlikedController } from './postliked.controller';
import { PostlikedService } from './postliked.service';

@Module({
  controllers: [PostlikedController],
  providers: [PostlikedService]
})
export class PostlikedModule {}
