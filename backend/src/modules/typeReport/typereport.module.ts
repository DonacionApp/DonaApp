import { Module } from '@nestjs/common';
import { TypereportController } from './typereport.controller';
import { TypereportService } from './typereport.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeReportEntity } from './entity/type.report.entity';

@Module({
  imports:[TypeOrmModule.forFeature([TypeReportEntity])],
  controllers: [TypereportController],
  providers: [TypereportService],
  exports: [TypereportService],
})
export class TypereportModule {}
