import { Module, forwardRef } from '@nestjs/common';
import { CommentsupportidController } from '../commentSupportId/commentsupportid.controller';
import { CommentsupportidService } from './commentsupportid.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentSupportIdEntity } from './entity/comment.supportid.entity';
import { UserModule } from '../user/user.module';
import { StatussupportidModule } from '../statussupportid/statussupportid.module';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([CommentSupportIdEntity]),
   forwardRef(()=> UserModule),
    StatussupportidModule,
    forwardRef(() => NotifyModule),
    forwardRef(() => TypeNotifyModule),
  ],
  controllers: [CommentsupportidController],
  providers: [CommentsupportidService],
  exports:[CommentsupportidService],
})
export class CommentsupportidModule {}
