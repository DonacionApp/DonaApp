import { forwardRef, Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { systemEntity } from './entity/system.entity';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';

@Module({
  imports: [TypeOrmModule.forFeature([systemEntity]), forwardRef(() => NotifyModule),
forwardRef(() => TypeNotifyModule)],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule { }
