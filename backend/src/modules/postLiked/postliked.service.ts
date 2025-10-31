import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostLikedEntity } from './entity/post.liked.entity';
import { Repository } from 'typeorm';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PostlikedService {
    constructor(
        @InjectRepository(PostLikedEntity)
        private readonly postLikedRepository: Repository<PostLikedEntity>,
        @Inject(forwardRef(()=>PostService))
        private readonly postService:PostService,
        private readonly userService:UserService,
    ){}

    async addLikeToPost(userId:number, postId:number):Promise<PostLikedEntity>{
        try {
            if(!userId || userId<=0 || userId===undefined || userId===null || isNaN(userId)){
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if(!postId || postId<=0 || postId===undefined || postId===null || isNaN(postId)){
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId=Number(postId);
            userId=Number(userId);
            const post =  await this.postService.getPostById(postId);
            if(!post){
                throw new BadRequestException('el post al que se le quiere dar like no existe');
            }
            const user= await this.userService.findById(userId);
            if(!user){
                throw new BadRequestException('el usuario que quiere dar like no existe');
            }
            const postLikedExist= await this.postLikedRepository.findOne({
                where:{
                    post:{
                        id:postId
                    },
                    user:{
                        id:userId
                    }
                }
            });
            if(postLikedExist){
                throw new BadRequestException('el usuario ya le ha dado like a este post');
            };
            const postliked=this.postLikedRepository.create({
                post:post,
                user:user
            });
            return await this.postLikedRepository.save(postliked);
        } catch (error) {
            throw error;
        }
    }

    async userLikedPost(userId:number, postId:number):Promise<boolean>{
        try {
            if(!userId || userId<=0 || userId===undefined || userId===null || isNaN(userId)){
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if(!postId || postId<=0 || postId===undefined || postId===null || isNaN(postId)){
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId=Number(postId);
            userId=Number(userId);
            const post =  await this.postService.getPostById(postId);
            if(!post){
                throw new BadRequestException('el post no existe');
            }
            const user= await this.userService.findById(userId);
            if(!user){
                throw new BadRequestException('el usuario no existe');
            }
            const postLiked = await this.postLikedRepository.findOne({
                where: {
                    post: {
                        id: postId
                    },
                    user: {
                        id: userId
                    }
                }
            });
            return !!postLiked;
        } catch (error) {
            throw error;
        }
    }
}
