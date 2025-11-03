import { Body, Controller, Post } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleEntity } from './entity/article.entity';
import { FiltersDtoArticles } from './dto/filters.dto.articles';

@Controller('article')
export class ArticleController {
    constructor(
        private readonly articleService:ArticleService
    ){}

    @Post('/all')
    async getAllArticles(@Body()dto:FiltersDtoArticles):Promise<ArticleEntity[]>{
        return await this.articleService.getAllArticles(dto)
    }

}
