import { Module } from '@nestjs/common';
import { UsersystemController } from './usersystem.controller';
import { UsersystemService } from './usersystem.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSystemEntity } from './entity/user.system.entity';
import { SystemModule } from '../system/system.module';

@Module({
  imports:[TypeOrmModule.forFeature([UserSystemEntity]),SystemModule],
  controllers: [UsersystemController],
  providers: [UsersystemService],
  exports:[UsersystemService]
})
export class UsersystemModule {}
