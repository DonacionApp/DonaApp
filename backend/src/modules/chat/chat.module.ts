import { forwardRef, Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatEntity } from './entity/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatstatusModule } from '../chatstatus/chatstatus.module';
import { UserchatModule } from '../userchat/userchat.module';
import { DonationModule } from '../donation/donation.module';
import { UserModule } from '../user/user.module';
import { MessagechatGateway } from '../messagechat/messagechat.gateway';
import { MessagechatModule } from '../messagechat/messagechat.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity]), ChatstatusModule, 
  forwardRef(() => UserchatModule), forwardRef(()=>DonationModule),
  forwardRef((()=>UserModule)), forwardRef(()=>MessagechatModule),
  forwardRef(()=>AuditModule)
],
  controllers: [ChatController],
  providers: [ChatService,],
  exports: [ChatService],
})
export class ChatModule {}
