import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';

@Module({
  controllers: [IaController],
  providers: [IaService]
})
export class IaModule {}
