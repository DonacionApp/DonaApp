import { Controller, Get, UseGuards, Param, ParseIntPipe, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { UserRankingQueryDto } from './dto/user-ranking.dto';
//esto sirve para definir los roles de usuario
export enum RolEnum {
    ADMIN = 'admin',
    SUPERADMIN = 'superadmin',
    USER = 'user',
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

    @Get('users/rankings')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RolEnum.ADMIN, RolEnum.SUPERADMIN)
    async getUserDonationRankings(@Query() query: UserRankingQueryDto){
        return await this.statisticsService.getUserDonationRankings(query);
    }

    @Get('users/rankings/donations-made')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RolEnum.ADMIN, RolEnum.SUPERADMIN)
    async getTopDonationsMade(@Query() query: UserRankingQueryDto){
        return await this.statisticsService.getTopDonationsMade(query);
    }

    @Get('users/rankings/donations-received')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RolEnum.ADMIN, RolEnum.SUPERADMIN)
    async getTopDonationsReceived(@Query() query: UserRankingQueryDto){
        return await this.statisticsService.getTopDonationsReceived(query);
    }

    @Get('users/rankings/average-rating')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(RolEnum.ADMIN, RolEnum.SUPERADMIN)
    async getTopAverageRating(@Query() query: UserRankingQueryDto){
        return await this.statisticsService.getTopAverageRating(query);
    }
}
