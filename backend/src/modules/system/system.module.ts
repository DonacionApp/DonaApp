import { forwardRef, Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { systemEntity } from './entity/system.entity';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([systemEntity]), forwardRef(() => NotifyModule),
forwardRef(() => TypeNotifyModule), forwardRef(() => AuditModule)],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule { }
