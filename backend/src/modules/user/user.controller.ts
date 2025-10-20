import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.userService.create(dto);
  }

  @Post('update/:id')
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return await this.userService.update(Number(id), dto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    return await this.userService.delete(Number(id));
  }
}
