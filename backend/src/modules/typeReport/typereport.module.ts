import { Module } from '@nestjs/common';
import { TypereportController } from './typereport.controller';
import { TypereportService } from './typereport.service';

@Module({
  controllers: [TypereportController],
  providers: [TypereportService]
})
export class TypereportModule {}
