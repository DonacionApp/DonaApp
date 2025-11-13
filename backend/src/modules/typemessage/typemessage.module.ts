import { Module } from '@nestjs/common';
import { TypemessageController } from './typemessage.controller';
import { TypemessageService } from './typemessage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeMessageEntity } from './entity/type.message.entity';

@Module({
  imports:[TypeOrmModule.forFeature([TypeMessageEntity])],
  controllers: [TypemessageController],
  providers: [TypemessageService],
  exports: [TypemessageService],
})
export class TypemessageModule {}
