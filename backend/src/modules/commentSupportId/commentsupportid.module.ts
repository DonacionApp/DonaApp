import { Module } from '@nestjs/common';
import { CommentsupportidController } from './commentsupportid.controller';
import { CommentsupportidService } from './commentsupportid.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentSupportIdEntity } from './entity/comment.supportid.entity';
import { UserModule } from '../user/user.module';
import { StatussupportidModule } from '../statussupportid/statussupportid.module';

@Module({
  imports:[TypeOrmModule.forFeature([CommentSupportIdEntity]), UserModule, StatussupportidModule],
  controllers: [CommentsupportidController],
  providers: [CommentsupportidService],
  exports:[CommentsupportidService],
})
export class CommentsupportidModule {}
