import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ArticleEntity } from './entity/article.entity';
import { FiltersDtoArticles } from './dto/filters.dto.articles';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ArticleService {
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository:Repository<ArticleEntity>,
    ){}

    async getAllArticles(dto?: FiltersDtoArticles):Promise<ArticleEntity[]>{
        try {
            const query = this.articleRepository.createQueryBuilder('article');

            if (dto?.name) {
                query.andWhere('article.name ILIKE :name', { name: `%${dto.name}%` });
            }

            if (dto?.orderBy) {
                query.orderBy('article.createdAt', dto.orderBy);
            }

            return await query.getMany();
        } catch (error) {
            throw error;
        }
    }

}
