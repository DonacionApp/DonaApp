import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserArticleEntity } from './entity/useraticle.entity';
import { Repository } from 'typeorm';
import { ArticleService } from '../article/article.service';
import { UserService } from '../user/user.service';
import { CreateUserArticleDto } from './dto/create.user.article.dto';
import { FilterUserArticleDto } from './dto/filter.user.article.dto';

@Injectable()
export class UserarticleService {
    constructor(
        @InjectRepository(UserArticleEntity)
        private readonly userArticleRepository:Repository<UserArticleEntity>,
        private readonly articleService: ArticleService,
        private readonly userService: UserService,
    ){}


    async getUserArticlesByUserId(userId:number, dto:FilterUserArticleDto):Promise<UserArticleEntity[]>{
        try {
            if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
                throw new BadRequestException('usuario invalido')
            };
            const queryBuilder = this.userArticleRepository.createQueryBuilder('userArticle')
            .leftJoinAndSelect('userArticle.article', 'article')
            .leftJoinAndSelect('userArticle.user', 'user')
            .where('user.id = :userId', { userId });
            if (dto.article) {
                queryBuilder.andWhere('article.id = :articleId', { articleId: dto.article });
            }
            if (dto.needed !== undefined) {
                queryBuilder.andWhere('userArticle.needed = :needed', { needed: dto.needed });
            }
            if (dto.search) {
                queryBuilder.andWhere('article.title ILIKE :search OR article.content ILIKE :search', { search: `%${dto.search}%` });
            }
            const query = await queryBuilder.getMany();
            if(!query || query.length===0){
                throw new NotFoundException('No se encontraron articulos para el usuario')
            }
            return query;
        } catch (error) {
            throw error;
        }
    }

    async addArticleToUser(dto: CreateUserArticleDto):Promise<UserArticleEntity>{
        try {
            const {user: userId, article: articleId} = dto;
            if(!userId || userId<=0 || !articleId || articleId<=0 || isNaN(userId) || userId===undefined || isNaN(articleId) || articleId===undefined){
                throw new BadRequestException('usuario o articulo invalido')
            };
            const article  = await this.articleService.getArticleById(articleId);
            if(!article){
                throw new NotFoundException('El articulo no existe')
            };
            const user = await this.userService.findById(userId);
            if(!user){
                throw new NotFoundException('El usuario no existe')
            };
            const userarticleExist = await this.userArticleRepository.findOne({
                where:{
                    user:{
                        id:userId
                    },
                    article:{
                        id:articleId
                    },
                    needed:dto.needed
                }
            });
            if(userarticleExist){
                throw new BadRequestException('El usuario ya tiene este articulo registrado con ese estado')
            };
            const userArticle = this.userArticleRepository.create({
                cant:dto.cant,
                needed:dto.needed,
                user:user,
                article:article
            });
            return await this.userArticleRepository.save(userArticle);
        } catch (error) {
            throw error;
        }
    }

    async updateUserArticle(id:number, cant:number):Promise<UserArticleEntity>{
        try{
            if(!id || id<=0 || isNaN(id) || id===undefined || !cant  || isNaN(cant) || cant===undefined){
                throw new BadRequestException('Datos invalidos')
            };
            if(cant<0){
                throw new BadRequestException('La cantidad no puede ser negativa')
            }
            const userArticle = await this.userArticleRepository.findOne({
                where:{
                    id
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            userArticle.cant = cant;
            return await this.userArticleRepository.save(userArticle);
        } catch (error) {
            throw error;
        }
    }

    async changeNeededStatus(id:number, needed:boolean):Promise<UserArticleEntity>{
        try{
            if(!id || id<=0 || isNaN(id) || id===undefined || needed===undefined){
                throw new BadRequestException('Datos invalidos')
            };
            const userArticle = await this.userArticleRepository.findOne({
                where:{
                    id
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            userArticle.needed = needed;
            return await this.userArticleRepository.save(userArticle);
        } catch (error) {
            throw error;
        }
    }

    async deleteUserArticle(id:number):Promise<{message:string, status:number}>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('Datos invalidos')
            }
            const userArticle = await this.userArticleRepository.findOne({
                where: {
                    id
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            await this.userArticleRepository.remove(userArticle);
            return { message: 'Articulo eliminado', status: 200 };
        } catch (error) {
            throw error;
        }
    }
}

       
