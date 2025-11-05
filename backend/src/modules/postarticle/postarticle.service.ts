import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostArticleEntity } from './entity/postarticle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostArticleDto } from './dto/create.post.article.dto';
import { PostService } from '../post/post.service';
import { ArticleService } from '../article/article.service';
import { StatusarticledonationService } from '../statusarticledonation/statusarticledonation.service';

@Injectable()
export class PostarticleService {
    constructor(
        @InjectRepository(PostArticleEntity)
        private readonly postArticleRepository: Repository<PostArticleEntity>,
        private readonly postService:PostService,
        private readonly articleService:ArticleService,
        private readonly statusArticleDonationService:StatusarticledonationService,
    ){}

    async findAll():Promise<PostArticleEntity[]>{
        try {
            const postArticles= await this.postArticleRepository.find();
            if(!postArticles || postArticles.length<=0){
                throw new NotFoundException('no hay articulos en posts')
            }
            const articlesWithouthUserInfo = postArticles.map(pa => {
                const { post, ...articleData } = pa;
                return articleData as any;
            });
            return articlesWithouthUserInfo;

        } catch (error) {
            throw error;
        }
    }

    async getPostArticleById(id:number):Promise<PostArticleEntity>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('post articulo invalido')
            }
            const postArticle= await this.postArticleRepository.findOne({
                where:{
                    id:id
                },
                relations:{
                    post:{
                        user:true
                    },
                    article:true,
                    status:true
                }
            });
            if(!postArticle){
                throw new NotFoundException('el post articulo no esta incluido en el post')
            }
            const postArticleWithoutUserInfo = (() => {
                const { post, ...articleData } = postArticle;
                return articleData;
            })();
            return postArticleWithoutUserInfo as any;
        } catch (error) {
            throw error;
        }
    }

    async findByPost(postId: number): Promise<PostArticleEntity[]> {
        try {
            if (!postId || postId <= 0 || isNaN(postId) || postId === undefined) {
                throw new BadRequestException('post invalido')
            }
            const postArticles= await this.postArticleRepository.find({
                where:{
                    post:{
                        id:postId
                    }
                },
                relations:{
                    post:{
                        user:true
                    },
                    article:true,
                    status:true
                }
            });
            if(!postArticles || postArticles.length<=0){
                throw new NotFoundException('no hay articulos para este post')
            }
            const articlesOuthUserInfo = postArticles.map(pa => {
                const { post, ...articleData } = pa;
                return articleData;
            });
            const articlesWithUserInfo = articlesOuthUserInfo.map((article: any) => {
                return {
                    ...article,
                    user: postArticles[0].post.user
                };
            });
            return articlesWithUserInfo;
        } catch (error) {
            throw error;
        }
    }

    async addPostArticle(dto:CreatePostArticleDto, userId:number, admin?:boolean):Promise<PostArticleEntity>{
        try {
            if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
                throw new BadRequestException('usuario invalido')
            }
            if(!dto.article || dto.article<=0 || isNaN(dto.article) || dto.article===undefined){
                throw new BadRequestException('articulo invalido')
            }
            if(!dto.post || dto.post<=0 || isNaN(dto.post) || dto.post===undefined){
                throw new BadRequestException('post invalido')
            }
            const postId:number=dto.post;
            const articleId:number=dto.article;
            const postExists= await this.postService.getPostById(postId);
            if(!postExists){
                throw new NotFoundException('el post no existe')
            }
            const existArticle= await this.articleService.getArticleById(articleId);
            if(!existArticle){
                throw new NotFoundException('el articulo no existe')
            }
            const statusDefault=await this.statusArticleDonationService.getStatusByName('disponible');
            if(!statusDefault){
                throw new NotFoundException('el estado por defecto no existe')
            }
            const quantity=dto.quantity.toString() || '1';
            //agregar estado            
            const newPostArticle= this.postArticleRepository.create({
                post:postExists,
                article:existArticle, 
                quantity:quantity,
                status:statusDefault               
            });
            return await this.postArticleRepository.save(newPostArticle);
        } catch (error) {
            throw error;
        }
    }

    async deletePostArticle(id:number, userId:number, admin?:boolean):Promise<{message:string, status:number}>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('post articulo invalido')
            }
            if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
                throw new BadRequestException('usuario invalido')
            }
            const postArticleExist= await this.postArticleRepository.findOne({
                where:{
                    id:id
                },
                relations:{
                    post:{
                        user:true
                    }
                }
            });
            if(!postArticleExist){
                throw new NotFoundException('el post articulo no existe')
            }
            if(!admin && postArticleExist.post.user.id!==userId){
                throw new BadRequestException('no tienes permisos para eliminar este post articulo')
            }
            await this.postArticleRepository.delete(id);
            return {message:'post articulo eliminado correctamente', status:200};
        } catch (error) {
            throw error;
        }
    }

    async updatePostArticleStatus(id:number, statusId:number, userId:number, admin?:boolean):Promise<PostArticleEntity>{
        try {
            if(!id || id<=0 || isNaN(id) || id===undefined){
                throw new BadRequestException('post articulo invalido')
            }
            if(!statusId || statusId<=0 || isNaN(statusId) || statusId===undefined){
                throw new BadRequestException('estado invalido')
            }
            if(!userId || userId<=0 || isNaN(userId) || userId===undefined){
                throw new BadRequestException('usuario invalido')
            }
            const postArticleExist= await this.postArticleRepository.findOne({
                where:{
                    id:id
                },
                relations:{
                    post:{
                        user:true
                    },
                    status:true
                }
            });
            if(!postArticleExist){
                throw new NotFoundException('el post articulo no existe')
            }
            if(!admin && postArticleExist.post.user.id!==userId){
                throw new BadRequestException('no tienes permisos para actualizar este post articulo')
            }
            const statusExist= await this.statusArticleDonationService.getSatausById(statusId);
            if(!statusExist){
                throw new NotFoundException('el estado no existe')
            }
            postArticleExist.status=statusExist;
            return await this.postArticleRepository.save(postArticleExist);
        } catch (error) {
            throw error;
        }
    }
}
