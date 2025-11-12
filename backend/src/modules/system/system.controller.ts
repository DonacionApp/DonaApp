import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { UpdatePoliciesDto } from './dto/update.policies.dto';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('system')
export class SystemController {
    constructor(
        private readonly systemService: SystemService
    ){}

    @Get('policies')
    async getPolicies(){
        return this.systemService.getSystemPolicies();
    }
    @Get('terms')
    async getTerms(){
        return this.systemService.getSystemTerms();
    }
    @Get('about-us')
    async getAboutUs(){
        return this.systemService.getSystemAboutUs();
    }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('admin')
    @Put('policies')
    async updatePolicies(@Body() body:UpdatePoliciesDto){ 
        return this.systemService.updateSystemPolicies(String(body.content));
    }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('admin')
    @Put('terms')
    async updateTerms(@Body() body:UpdatePoliciesDto){ 
        return this.systemService.updateSystemTerms(body.content);
    }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles('admin')
    @Put('about-us')
    async updateAboutUs(@Body() body:UpdatePoliciesDto){ 
        return this.systemService.updateSystemAboutUs(body.content);
    }
}
