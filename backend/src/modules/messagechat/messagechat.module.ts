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
import { MessagechatGateway } from './messagechat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';

@Module({
  imports:[TypeOrmModule.forFeature([MessageChatEntity]), forwardRef(()=>ChatModule),
 forwardRef(()=>UserModule), TypemessageModule, forwardRef(()=>CloudinaryModule),
  forwardRef(()=>UserchatModule),forwardRef(()=>NotifyModule), forwardRef(()=>TypeNotifyModule),
  JwtModule.registerAsync({
           imports: [ConfigModule],
           useFactory: async (configService: ConfigService) => ({
              secret: configService.get('JWT_SECRET'),
              signOptions: { expiresIn: '1d' },
           }),
           inject: [ConfigService],
        }),
],
  controllers: [MessagechatController],
  providers: [MessagechatService, MessagechatGateway],
  exports: [MessagechatService],
})
export class MessagechatModule {}
