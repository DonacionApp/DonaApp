import { forwardRef, Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entity/report.entity';
import { TypereportModule } from '../typeReport/typereport.module';
import { UserModule } from '../user/user.module';
import { NotifyModule } from '../notify/notify.module';
import { TypeNotifyModule } from '../typenotify/typenotify.module';

@Module({
  imports:[TypeOrmModule.forFeature([ReportEntity]), TypereportModule,
  forwardRef(() => UserModule), forwardRef(() => NotifyModule), forwardRef(()=>TypeNotifyModule)],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
