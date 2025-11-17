import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { RespaldoiaModule } from './respaldoia/respaldoia.module';

@Module({
  controllers: [IaController],
  providers: [IaService],
  imports: [RespaldoiaModule, RespaldoiaModule]
})
export class IaModule {}
