import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { ArticleEntity } from './entity/article.entity';
import { FiltersDtoArticles } from './dto/filters.dto.articles';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateArticleDto } from './dto/create.article.dto';
import { UpdateArticleDto } from './dto/update.article.dto';

@Injectable()
export class ArticleService {
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly articleRepository: Repository<ArticleEntity>,
    ) { }

    async getAllArticles(dto?: FiltersDtoArticles): Promise<ArticleEntity[]> {
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

    async getArticleById(id: number): Promise<ArticleEntity> {
        try {
            if (!id || id <= 0 || isNaN(id) || id === undefined) {
                throw new BadRequestException('articulo invalido');
            }
            const article = await this.articleRepository.findOne({
                where: {
                    id: id
                }
            });
            if (!article) {
                throw new NotFoundException('articulo no encontrado');
            }
            return article;
        } catch (error) {
            throw error;
        }
    }

    async getArticleByName(name: string): Promise<ArticleEntity> {
        try {
            if (!name || name.trim() === '' || name === undefined) {
                throw new BadRequestException('nombre de articulo invalido')
            }
            const article = await this.articleRepository.findOne({
                where: {
                    name: name
                }
            })
            if (!article) {
                throw new NotFoundException('articulo no encontrado');
            }
            return article;
        } catch (error) {
            throw error;
        }
    }

    async createArticle(dto: CreateArticleDto): Promise<ArticleEntity> {
        try {
            if (!dto || !dto.name || dto.name.trim() === '' || dto.name === undefined) {
                throw new BadRequestException('datos invalidos para crear articulo');
            }
            dto.name = dto.name.trim().toLowerCase();
            const existArticle = await this.articleRepository.findOne({
                where: {
                    name: dto.name
                }
            });
            if (existArticle) {
                throw new BadRequestException('el articulo ya existe');
            };
            const newArticle = this.articleRepository.create({
                name: dto.name,
                descripcion: dto.description
            })
            return await this.articleRepository.save(newArticle);
        } catch (error) {
            throw error;
        }
    }

    async updateArticle(id: number, dto: UpdateArticleDto): Promise<ArticleEntity> {
        try {
            if (!id || id <= 0 || isNaN(id) || id === undefined) {
                throw new BadRequestException('articulo invalido');
            }
            if ((!dto || !dto.name || dto.name.trim() === '' || dto.name === undefined) &&
                (!dto || !dto.description || dto.description.trim() === '' || dto.description === undefined)
            ) {
                throw new BadRequestException('datos invalidos para actualizar articulo');
            }
            if (dto && typeof dto.name === 'string' && dto.name.trim() !== '') {
                dto.name = dto.name.trim().toLowerCase();
            }
            const article = await this.getArticleById(id);
            if (!article) {
                throw new NotFoundException('articulo no encontrado');
            }
            if (dto.name) {
                const existArticle = await this.articleRepository.findOne({
                    where: {
                        name: dto.name,
                        id: Not(id)
                    }
                });
                if (existArticle) {
                    throw new ForbiddenException('el nombre del articulo ya existe');
                }
            }

            if (dto.name) {
                dto.name = dto.name.trim().toLowerCase();
                article.name = dto.name;
            }
            if (dto.description) {
                dto.description = dto.description.trim();
                article.descripcion = dto.description;
            }



            return await this.articleRepository.save(article);
        } catch (error) {
            throw error;
        }
    }

    async deleteArticle(id: number): Promise<{ message: string, status: number }> {
        try {
            if (!id || id <= 0 || isNaN(id) || id === undefined) {
                throw new BadRequestException('articulo invalido');
            }
            const article = await this.getArticleById(id);
            if (!article) {
                throw new NotFoundException('articulo no encontrado');
            }
            await this.articleRepository.delete(id);
            return { message: 'articulo eliminado correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }

}
