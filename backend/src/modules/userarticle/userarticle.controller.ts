import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserarticleService } from './userarticle.service';
import { FilterUserArticleDto } from './dto/filter.user.article.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CreateUserArticleDto } from './dto/create.user.article.dto';
import { UpdateQuantityDto } from './dto/update.quantity.dto';

@Controller('userarticle')
export class UserarticleController {
    constructor(
        private readonly userArticleService: UserarticleService
    ){}
    
    @UseGuards(JwtAuthGuard)
    @Post('/user/me')
    async getUserArticles( @Body() dto: FilterUserArticleDto, @Req()req:any) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.getUserArticlesByUserId(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/add')
    async addArticleToUser(@Req() req:any, @Body() dto:CreateUserArticleDto) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        dto.user=userId;
        return this.userArticleService.addArticleToUser(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/update/quantity')
    async updateUserArticleQuantity(@Req() req:any, @Body() dto:UpdateQuantityDto) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.updateUserArticle(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/update/needed/:id')
    async updateUserArticleNeeded(@Req() req:any, @Param('id') id:number) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.changeNeededStatus(id,userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/delete/:id')
    async deleteUserArticle(@Req() req:any, @Param('id') id:number) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }  
        return this.userArticleService.deleteUserArticle(id, userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('/delete/admin/:id')
    async deleteUserArticleByAdmin(@Req() req:any, @Param('id') id:number) {    
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.deleteUserArticle(id, userId, true);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('update/needed/admin/:userArticleId')
    async updateUserArticleNeededByAdmin(@Req() req:any, @Param('userArticleId') userArticleId:number) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.changeNeededStatus(userArticleId,userId, true);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/update/quantity/admin')
    async updateUserArticleQuantityByAdmin(@Req() req:any, @Body() dto:UpdateQuantityDto) {
        const userId = req.user.id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.updateUserArticle(userId, dto, true);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/add/admin')
    async addArticleToUserByAdmin(@Body() dto:CreateUserArticleDto) {
        return this.userArticleService.addArticleToUser(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/user/admin/:id')
    async getUserArticlesByUserId( @Param('id') id:number, @Req()req:any, @Body() dto: FilterUserArticleDto) {
        const userId = id;
        if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
            throw new Error('usuario invalido')
        }
        return this.userArticleService.getUserArticlesByUserId(userId, dto);
    }
}
