import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostArticleEntity } from './entity/postarticle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostArticleDto } from './dto/create.post.article.dto';
import { PostService } from '../post/post.service';
import { ArticleService } from '../article/article.service';

@Injectable()
export class PostarticleService {
    constructor(
        @InjectRepository(PostArticleEntity)
        private readonly postArticleRepository: Repository<PostArticleEntity>,
        private readonly postService:PostService,
        private readonly articleService:ArticleService,
    ){}

    async findAll():Promise<PostArticleEntity[]>{
        try {
            return await this.postArticleRepository.find();
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
                    article:true
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
            const newPostArticle= this.postArticleRepository.create({
                post:postExists,
                article:existArticle
            });
            return await this.postArticleRepository.save(newPostArticle);
        } catch (error) {
            throw error;
        }
    }
}
