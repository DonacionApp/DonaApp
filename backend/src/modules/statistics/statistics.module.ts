import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entity/user.entity';
//modulo de estadisticas que importa el repositorio de usuarios, el controlador y el servicio
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [StatisticsController],
  providers: [StatisticsService]
})
export class StatisticsModule {}
