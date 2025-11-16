import { Body, Controller, Get, Query, Post, UseGuards, Req, Param, Res } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { DeleteUserAuditDto } from './dto/delete-user-audit.dto';
import { DeleteRangeDto } from './dto/delete-range.dto';
import { ExportAuditDto } from './dto/export-audit.dto';
import { Response } from 'express';

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

  // Obtener acciones del usuario autenticado (soporte a scroll infinito via limit/offset/page)
  @UseGuards(JwtAuthGuard)
  @Post('me/actions')
  async getMyActions(@Req() req: any, @Body() dto: QueryAuditDto) {
    const current = req.user?.sub || req.user?.id || req.user?.userId;
    return this.auditService.findByUser(Number(current), dto, Number(current), false);
  }

  // Endpoint admin para obtener acciones de un usuario por id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/user/:id/actions')
  async getUserActions(@Param('id') id: string, @Req() req: any, @Body() dto: QueryAuditDto) {
    const current = req.user?.sub || req.user?.id || req.user?.userId;
    return this.auditService.findByUser(Number(id), dto, Number(current), true);
  }

  // Eliminar auditoría de un usuario: por auditId, por rango o first30Day
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/user/:id/delete')
  async deleteUserAudit(@Param('id') id: string, @Req() req: any, @Body() dto: DeleteUserAuditDto) {
    const adminId = req.user?.sub || req.user?.id || req.user?.userId;
    // si auditId proporcionado -> eliminar registro de auditoría individual
    if (dto.auditId) {
      return this.auditService.deleteAuditById(Number(dto.auditId), Number(adminId));
    }

    // si first30Day flag -> eliminar primeros 30 días para ese usuario
    if (dto.first30Day) {
      return this.auditService.deleteUserFirst30Days(Number(id), Number(adminId));
    }

    // si minDate y maxDate -> eliminar en rango de fechas
    if (dto.minDate && dto.maxDate) {
      return this.auditService.deleteUserRange(Number(id), dto.minDate, dto.maxDate, Number(adminId));
    }

    return { message: 'No valid delete parameter provided', deleted: 0 };
  }

  // Eliminar actividad en rango de fechas para todos los usuarios (admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/delete-range')
  async deleteRangeAll(@Req() req: any, @Body() dto: DeleteRangeDto) {
    const adminId = req.user?.sub || req.user?.id || req.user?.userId;
    return this.auditService.deleteRangeAll(dto.minDate, dto.maxDate, Number(adminId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/export')
  async exportAudit(@Body() dto: ExportAuditDto, @Res() res: Response) {
    const { workbook, format, filename } = await this.auditService.generateAuditExport(dto);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      await workbook.xlsx.write(res);
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      await workbook.csv.write(res);
    }
    res.end();
  }
}
