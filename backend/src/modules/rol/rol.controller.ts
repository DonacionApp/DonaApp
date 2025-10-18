import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create.rol.dto';
import { UpdateRolDto } from './dto/update.rol.dto';

@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

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

  @Post()
  async create(@Body() dto: CreateRolDto) {
    return await this.rolService.create(dto);
  }

  @Post('update/:id')
  async update(@Param('id') id: number, @Body() dto: UpdateRolDto) {
    return await this.rolService.update(Number(id), dto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return await this.rolService.delete(Number(id));
  }
}
