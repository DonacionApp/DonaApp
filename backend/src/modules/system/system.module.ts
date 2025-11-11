import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { systemEntity } from './entity/system.entity';

@Module({
  imports:[TypeOrmModule.forFeature([systemEntity])],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
