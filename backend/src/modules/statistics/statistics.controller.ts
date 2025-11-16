import { Controller, Get, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
//esto sirve para definir los roles de usuario
export enum RolEnum {
    ADMIN = 'ADMIN',
    SUPERADMIN = 'SUPERADMIN',
    USER = 'USER',
}
//esto es el controlador de estadisticas por roles
@Controller('statistics')
export class StatisticsController {

    constructor(private readonly statisticsService: StatisticsService){}

    @Get('user/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RolEnum.ADMIN, RolEnum.SUPERADMIN)
    async getUserMetrics(@Param('id', ParseIntPipe) id: number){
        return await this.statisticsService.getUserMetrics(id);
    }
}
