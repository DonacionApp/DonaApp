import { forwardRef, Module } from '@nestjs/common';
import { UserchatController } from './userchat.controller';
import { UserchatService } from './userchat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserChatEntity } from './entity/user.chat.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports:[TypeOrmModule.forFeature([UserChatEntity]), forwardRef(() => UserModule)],
  controllers: [UserchatController],
  providers: [UserchatService],
  exports: [UserchatService],
})
export class UserchatModule {}
