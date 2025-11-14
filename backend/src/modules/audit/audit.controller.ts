import { Body, Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { FilterAuditDto } from './dto/filter-audit.dto';

export class CreateAuditDto {
  userId: number;
  action: string;
  comment?: string;
  statusCode?: number;
  payload?: any;
}

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // Endpoint público interno para crear logs (se recomienda usarlo desde servicios)
  @Post('create')
  async create(@Body() dto: CreateAuditDto) {
    return this.auditService.createLog(dto.userId, dto.action, dto.comment ?? '', dto.statusCode ?? 0, dto.payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  async findAll(@Query() filter: FilterAuditDto) {
    const parsed: any = {};
    if (filter.userId) parsed.userId = Number(filter.userId);
    if (filter.action) parsed.action = filter.action;
    if (filter.from) parsed.from = filter.from;
    if (filter.to) parsed.to = filter.to;
    return this.auditService.findAll(parsed);
  }
}
