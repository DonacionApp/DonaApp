import { Module } from '@nestjs/common';
import { CommentsupportidController } from './commentsupportid.controller';
import { CommentsupportidService } from './commentsupportid.service';

@Module({
  controllers: [CommentsupportidController],
  providers: [CommentsupportidService]
})
export class CommentsupportidModule {}
