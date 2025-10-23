import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, UnauthorizedException, Put } from '@nestjs/common';
import { UpdateUserProfileDto } from './dto/update.user.profile.dto';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * GET /user/me
   * Devuelve el perfil básico del usuario autenticado (sin password).
   * - Protegido por JWT
   * - Retorna 401 si no hay token válido
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Usuario no autenticado.');
    const user = await this.userService.findById(Number(userId));
    // eliminar password antes de devolver
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...publicUser } = user as any;
    return publicUser;
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req:any, @Body() dto: UpdateUserProfileDto){
    const userId = req.user?.id;
    if(!userId) throw new UnauthorizedException('Usuario no autenticado.');
    const updated = await this.userService.updateProfile(Number(userId), dto);
    const { password, ...publicUser } = updated as any;
    return publicUser;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.userService.findById(Number(id));
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    return await this.userService.findByUsername(username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('update/:id')
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return await this.userService.update(Number(id), dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return await this.userService.delete(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('change-role/:id')
  async changeRole(@Param('id') id: number, @Body('roleId') roleId: number) {
    return await this.userService.changeRole(Number(id), roleId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('change-block-status/:id')
  async changeBlockStatus(@Param('id') id: number, @Body('block') block: boolean) {
    return await this.userService.changeBlockStatus(Number(id), block);
  }

}
