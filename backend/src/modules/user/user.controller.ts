import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, UnauthorizedException, Put, Head, Header, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,

  ) { }

  @Get('minimal/:id')
  async getUserInfoMinimal(@Param('id') id: number) {
    return await this.userService.getUserInfoMinimal(Number(id));
  }

  @Get('/minimal/all/organizations')
  async getAllOrganizationsMinimal() {
    return await this.userService.getOrganzationUsers();
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
