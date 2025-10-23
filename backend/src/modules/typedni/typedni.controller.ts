import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TypedniService } from './typedni.service';
import { CreatetypeDniDto } from './dto/create.type.dni.dto';
import { UpdateTypeDniDto } from './dto/update.type.dni.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('typedni')
export class TypedniController {
    constructor(
        private readonly typeDniService: TypedniService,
    ) { }


    @Get()
    async fyndAll() {
        return await this.typeDniService.fyndAll();
    }

    @Get(':idType')
    async fyndById(@Param('idType') idType: number) {
        return await this.typeDniService.fyndById(idType);
    }

    @Get('name/:typeDni')
    async fyndByName(@Param('typeDni') typeDni: string) {
        return await this.typeDniService.fyndByname(typeDni);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() createDto: CreatetypeDniDto) {
        return await this.typeDniService.create(createDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('update/:idType')
    async update(@Param('idType') idType: number, @Body() updateDto: UpdateTypeDniDto) {
        console.log('idType : ', idType)
        return await this.typeDniService.update(idType, updateDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('delete/:idType')
    async delete(@Param('idType') idType: number) {
        return await this.typeDniService.delete(idType);
    }

}
