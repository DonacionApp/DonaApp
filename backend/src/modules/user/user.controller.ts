import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, UnauthorizedException, Put, Head, Header, Headers, Query } from '@nestjs/common';
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
  async getAllOrganizationsMinimal(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('searchParam') searchParam?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const opts: any = {};
    if (limit) opts.limit = Number(limit);
    if (offset) opts.offset = Number(offset);
    if (page) opts.page = Number(page);
    if (cursor) opts.cursor = cursor;
    if (searchParam) opts.searchParam = String(searchParam);
    if (orderBy) opts.orderBy = String(orderBy);
    return await this.userService.getOrganzationUsers(opts);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('upload-support')
  async usersUploadIdSupport(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: 'created' | 'updated',
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('hasSupport') hasSupport?: string,
  ) {
    const opts: any = {};
    if (limit) opts.limit = Number(limit);
    if (cursor) opts.cursor = cursor;
    if (search) opts.search = String(search);
    if (orderBy) opts.orderBy = orderBy;
    if (order) opts.order = order;
    if (hasSupport) opts.hasSupport = hasSupport === 'true';
    return await this.userService.usersUploadIdSupport(opts);
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
    // admin updates should allow password reset/change
    return await this.userService.update(Number(id), dto, true);
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
