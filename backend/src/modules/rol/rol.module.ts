import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from './entity/rol.entity';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity])],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService]
})
export class RolModule {}
