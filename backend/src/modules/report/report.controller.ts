import { Body, Controller, Post, Req, UseGuards, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { CreateReportDto } from './dto/create.report.dto';

@Controller('report')
export class ReportController {
    constructor(
        private readonly reportService: ReportService,
    ){}
    @UseGuards(JwtAuthGuard)
    @Post('create/new')
    async createReport(@Body() dto: CreateReportDto, @Req() req:any){
        const userId= req.user.id;
        return await this.reportService.createReport(dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('list')
    async getReports(
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('search') search?: string,
        @Query('orderBy') orderBy?: string,
        @Query('order') order?: string,
    ){
        const options = {
            limit,
            cursor,
            search,
            orderBy,
            order,
        };
        return await this.reportService.getReports(options);
    }
}
