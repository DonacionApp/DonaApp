import { forwardRef, Module } from '@nestjs/common';
import { MessagechatController } from './messagechat.controller';
import { MessagechatService } from './messagechat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageChatEntity } from './entity/message.chat.entity';
import { ChatModule } from '../chat/chat.module';
import { UserModule } from '../user/user.module';
import { TypemessageModule } from '../typemessage/typemessage.module';
import { CloudinaryModule } from 'src/core/cloudinary/cloudinary.module';
import { UserchatModule } from '../userchat/userchat.module';

@Module({
  imports:[TypeOrmModule.forFeature([MessageChatEntity]), forwardRef(()=>ChatModule),
 forwardRef(()=>UserModule), TypemessageModule, forwardRef(()=>CloudinaryModule),
  forwardRef(()=>UserchatModule)
],
  controllers: [MessagechatController],
  providers: [MessagechatService],
  exports: [MessagechatService],
})
export class MessagechatModule {}
