import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TypepostService } from './typepost.service';
import { TypePostEntity } from './entity/type.port.entity';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('typepost')
export class TypepostController {
    constructor(
        private readonly typePostService:TypepostService
    ){}

    @Get()
    async findAll():Promise<TypePostEntity[]>{
        try {
           return await this.typePostService.findAll(); 
        } catch (error) {
            throw error;
        }
        
    }

    @Get('name/:name')
    async findByName(name:string):Promise<any>{
        try {
            return await this.typePostService.findByName(name);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('create')
    async create(@Body() {typePost}: {typePost: string}):Promise<any>{
        try {
            return await this.typePostService.create(typePost);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('update/:id')
    async update(@Param('id') id: number, @Body() { typePost }: { typePost: string }): Promise<any> {
        try {
            return await this.typePostService.update(id, typePost);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('delete/:id')
    async deleteType(@Param('id') id:number):Promise<any>{
        try {
            return await this.typePostService.delete(id);
        } catch (error) {
            throw error;
        }
    }
}
