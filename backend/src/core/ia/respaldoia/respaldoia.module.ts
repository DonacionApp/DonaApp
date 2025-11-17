import { Module } from '@nestjs/common';
import { RespaldoiaService } from './respaldoia.service';

@Module({
  providers: [RespaldoiaService],
  exports: [RespaldoiaService],
})
export class RespaldoiaModule {}
