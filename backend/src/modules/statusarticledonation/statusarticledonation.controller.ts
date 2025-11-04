import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StatusarticledonationService } from './statusarticledonation.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('statusarticledonation')
export class StatusarticledonationController {
    constructor(
        private readonly statusarticledonationService: StatusarticledonationService
    ) { }

    @Get('/')
    async findAll() {
        return await this.statusarticledonationService.findAll();
    }

    @Get('name/:name')
    async getStatusByName(@Param('name') name: string) {
        return await this.statusarticledonationService.getStatusByName(name);
    }
    @Get('/:id')
    async getSatausById(@Param('id') id: number) {
        return await this.statusarticledonationService.getSatausById(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/admin/create')
    async createStatus(@Body()dto:{ name: string}) {
        return await this.statusarticledonationService.createStatus(dto.name);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('/admin/delete/:id')
    async deleteStatus(@Param('id') id: number) {
        return await this.statusarticledonationService.deleteStatus(id);
    }
}
