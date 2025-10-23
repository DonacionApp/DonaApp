import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create.rol.dto';
import { UpdateRolDto } from './dto/update.rol.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return await this.rolService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.rolService.findById(Number(id));
  }

  @Get('name/:rol')
  async findByName(@Param('rol') rol: string) {
    return await this.rolService.findByName(rol);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateRolDto) {
    return await this.rolService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('update/:id')
  async update(@Param('id') id: number, @Body() dto: UpdateRolDto) {
    return await this.rolService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return await this.rolService.delete(Number(id));
  }

  @Get('all/roles')
  async getAllRoles() {
    return await this.rolService.loadAllRolesOutAdmin();
  }
}
