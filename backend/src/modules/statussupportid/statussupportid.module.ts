import { Module } from '@nestjs/common';
import { StatussupportidController } from './statussupportid.controller';
import { StatussupportidService } from './statussupportid.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusSupportIdEntity } from './entity/status.supportid.entity';

@Module({
  imports:[TypeOrmModule.forFeature([StatusSupportIdEntity])],
  controllers: [StatussupportidController],
  providers: [StatussupportidService],
  exports:[StatussupportidService],
})
export class StatussupportidModule {}
