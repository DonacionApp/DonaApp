import { forwardRef, Module } from '@nestjs/common';
import { MessagechatController } from './messagechat.controller';
import { MessagechatService } from './messagechat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageChatEntity } from './entity/message.chat.entity';
import { ChatModule } from '../chat/chat.module';
import { UserModule } from '../user/user.module';
import { TypemessageModule } from '../typemessage/typemessage.module';

@Module({
  imports:[TypeOrmModule.forFeature([MessageChatEntity]), forwardRef(()=>ChatModule),
 forwardRef(()=>UserModule), TypemessageModule],
  controllers: [MessagechatController],
  providers: [MessagechatService],
  exports: [MessagechatService],
})
export class MessagechatModule {}
