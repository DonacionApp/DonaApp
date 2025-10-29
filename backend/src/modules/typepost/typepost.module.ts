import { Module } from '@nestjs/common';
import { TypepostController } from './typepost.controller';
import { TypepostService } from './typepost.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypePostEntity } from './entity/type.port.entity';

@Module({
  imports:[TypeOrmModule.forFeature([TypePostEntity])],
  controllers: [TypepostController],
  providers: [TypepostService],
  exports:[TypepostService],
})
export class TypepostModule {}
