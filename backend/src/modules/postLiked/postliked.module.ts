import { forwardRef, Module } from '@nestjs/common';
import { PostlikedController } from '../postLiked/postliked.controller';
import { PostlikedService } from '../postLiked/postliked.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLikedEntity } from './entity/post.liked.entity';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([PostLikedEntity]),
    forwardRef(()=>PostModule),
    UserModule,
    NotifyModule,
    TypeNotifyModule,
    forwardRef(() => AuditModule)
  ],
  controllers: [PostlikedController],
  providers: [PostlikedService],
  exports:[PostlikedService]
})
export class PostlikedModule {}
