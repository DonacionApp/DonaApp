import { forwardRef, Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatEntity } from './entity/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatstatusModule } from '../chatstatus/chatstatus.module';
import { UserchatModule } from '../userchat/userchat.module';
import { DonationModule } from '../donation/donation.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity]), ChatstatusModule, forwardRef(() => UserchatModule), forwardRef(()=>DonationModule)],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
