import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleEntity } from './entity/article.entity';
import { FiltersDtoArticles } from './dto/filters.dto.articles';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { CreateArticleDto } from './dto/create.article.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { UpdateArticleDto } from './dto/update.article.dto';

@Controller('article')
export class ArticleController {
    constructor(
        private readonly articleService:ArticleService
    ){}

    @Post('/all')
    async getAllArticles(@Body()dto:FiltersDtoArticles):Promise<ArticleEntity[]>{
        return await this.articleService.getAllArticles(dto)
    }
    
    @Get('/find/:id')
    async getArticleById(@Param('id') id: number): Promise<ArticleEntity> {
        return await this.articleService.getArticleById(id);
    }

    @Get('/find/name/:name')
    async getArticleByName(@Param('name') name: string): Promise<ArticleEntity> {
        return await this.articleService.getArticleByName(name);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/create')
    async createArticle(@Body() dto:CreateArticleDto):Promise<ArticleEntity>{
        return await this.articleService.createArticle(dto)
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/update/admin/:id')
    async updateArticle(@Param('id') id: number, @Body() dto: UpdateArticleDto): Promise<ArticleEntity> {
        return await this.articleService.updateArticle(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('/delete/:id')
    async deleteArticle(@Param('id') id: number): Promise<{ message: string }> {
        return await this.articleService.deleteArticle(id);
    }

}
