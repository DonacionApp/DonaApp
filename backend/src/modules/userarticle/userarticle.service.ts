import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserArticleEntity } from './entity/useraticle.entity';
import { Repository } from 'typeorm';
import { ArticleService } from '../article/article.service';
import { UserService } from '../user/user.service';
import { CreateUserArticleDto } from './dto/create.user.article.dto';
import { FilterUserArticleDto } from './dto/filter.user.article.dto';
import { UpdateQuantityDto } from './dto/update.quantity.dto';

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
                queryBuilder.andWhere('article.name ILIKE :search OR article.descripcion ILIKE :search', { search: `%${dto.search}%` });

            }
            const query = await queryBuilder.getMany();
            if(!query || query.length===0){
                throw new NotFoundException('No se encontraron articulos para el usuario')
            }
            const userArticlesWithouthUser = query.map(({ user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...userArticleRest }) => userArticleRest as any);
            return userArticlesWithouthUser;
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
            
            // Buscar si ya existe el artículo con el mismo estado de necesidad
            const userarticleExist = await this.userArticleRepository.findOne({
                where:{
                    user:{
                        id:userId
                    },
                    article:{
                        id:articleId
                    },
                    needed:dto.needed
                },
                relations: {
                    user: true,
                    article: true
                }
            });
            
            // Si existe, actualizar la cantidad sumando la nueva
            if(userarticleExist){
                const newQuantity = Number(userarticleExist.cant) + Number(dto.cant);
                userarticleExist.cant = newQuantity;
                const updated = await this.userArticleRepository.save(userarticleExist);
                
                // Sanitizar respuesta solo si user existe
                if (updated.user) {
                    const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...userArticleRest } = updated;
                    return userArticleRest as any;
                }
                return updated;
            }
            
            // Si no existe, crear nuevo
            const userArticle = this.userArticleRepository.create({
                cant:dto.cant,
                needed:dto.needed,
                user:user,
                article:article
            });
            const userArticleSave= await this.userArticleRepository.save(userArticle);
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...userArticleRest } = userArticleSave;
            return userArticleRest as any;
        } catch (error) {
            throw error;
        }
    }

    async updateUserArticle(idUser:number, dto:UpdateQuantityDto, admin?:boolean):Promise<UserArticleEntity>{
        try{
            const id=dto.userArticleId;
            const cant=dto.cant;
            if(!id || id<=0 || isNaN(id) || id===undefined || !cant  || isNaN(cant) || cant===undefined){
                throw new BadRequestException('Datos invalidos')
            };
            if(cant<0){
                throw new BadRequestException('La cantidad no puede ser negativa')
            }
            const userArticle = await this.userArticleRepository.findOne({
                where:{
                    id
                },
                relations:{
                    user:true
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            if(userArticle.user.id!==idUser && !admin){
                throw new BadRequestException('El articulo no pertenece al usuario')
            }
            userArticle.cant = cant;
            const articleuser= await this.userArticleRepository.save(userArticle);
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...userArticleRest } = articleuser;
            return userArticleRest as any;
        } catch (error) {
            throw error;
        }
    }

    async changeNeededStatus(id:number,userId:number, admin?:boolean):Promise<UserArticleEntity>{
        try{
            if(!id || id<=0 || isNaN(id) || id===undefined ){
                throw new BadRequestException('Datos invalidos')
            };
            const userArticle = await this.userArticleRepository.findOne({
                where:{
                    id
                },relations:{
                    user:true
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            if(userArticle.user.id!==userId && !admin){
                throw new BadRequestException('El articulo no pertenece al usuario')
            }
            userArticle.needed = userArticle.needed ? false : true;
            const articleUser= await this.userArticleRepository.save(userArticle);
            const { user: { password, email, token, loginAttempts, lockUntil, block, dateSendCodigo, ...userRest }, ...userArticleRest } = articleUser;
            return userArticleRest as any;
        } catch (error) {
            throw error;
        }
    }

    async deleteUserArticle(id:number, userId:number, admin?:boolean,):Promise<{message:string, status:number}>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('Datos invalidos')
            }
            const userArticle = await this.userArticleRepository.findOne({
                where: {
                    id
                },
                relations:{
                    user:true
                }
            });
            if(!userArticle){
                throw new NotFoundException('El articulo no existe')
            };
            if(userArticle.user.id!==userId && !admin){
                throw new BadRequestException('El articulo no pertenece al usuario')
            }
            await this.userArticleRepository.remove(userArticle);
            return { message: 'Articulo eliminado', status: 200 };
        } catch (error) {
            throw error;
        }
    }
}

       
