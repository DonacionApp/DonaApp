import { Module } from '@nestjs/common';
import { ChatstatusController } from './chatstatus.controller';
import { ChatstatusService } from './chatstatus.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatStatusEntity } from './entity/chat.status.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ChatStatusEntity])],
  controllers: [ChatstatusController],
  providers: [ChatstatusService],
  exports: [ChatstatusService],
})
export class ChatstatusModule {}
