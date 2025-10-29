import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('tags')
export class TagsController {
    constructor (
        private readonly tagsService: TagsService
    ){}

    @Get()
    async getAllTags(){
        try {
            return await this.tagsService.getAllTags();
        } catch (error) {
            throw error;
        }
    }

    @Get('id/:id')
    async getTagById(@Param('id') id: number) {
        try {
            return await this.tagsService.getTagById(id);
        } catch (error) {
            throw error;
        }
    }

    @Get('name/:tag')
    async getTagByName(@Param('tag') tag: string) {
        try {
            return await this.tagsService.getTabByName(tag);
        } catch (error) {
            throw error;
        }
    }
    @Post('create/')
    async createTag(@Body('tag') tag:string){
        try {
            return await this.tagsService.createTag(tag);
        } catch (error) {
            throw error;
        }
    }
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('update/:id')
    async updateTag(@Param('id') id: number, @Body('tag') tag: string) {
        try {
            return await this.tagsService.updateTag(id, tag);
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('delete/:id')
    async deleteTag(@Param('id') id:number){
        try {
            return await this.tagsService.deletetag(id);
        } catch (error) {
            throw error;
        }
    }
}