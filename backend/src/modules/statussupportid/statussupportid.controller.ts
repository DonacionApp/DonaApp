import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StatussupportidService } from './statussupportid.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('statussupportid')
export class StatussupportidController {
    constructor(
        private readonly statussupportidService: StatussupportidService,
    ){}

    @Get('/all')
   async getAllStatusSupportId() {
       return await this.statussupportidService.getAllStatusSupportId();
   }

   @Get('search/id/:id')
   async getStatusSupportIdById(@Param('id') id: number) {
       return await this.statussupportidService.getStatusSupportIdById(id);
   }

   @Get('search/name/:name')
   async getStatusSupportIdByName(@Param('name') name: string) {
       return await this.statussupportidService.getStatusSupportIdByName(name);
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Post('/create')
   async createStatusSupportId(@Body() dto:{name: string}) {
       return await this.statussupportidService.createStatusSupportId(dto.name);
   }

   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('admin')
   @Delete('/delete/:id')
   async deleteStatusSupportId(@Param('id') id: number) {
       return await this.statussupportidService.deleteStatusSupportId(id);
   }

}
