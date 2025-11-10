import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostLikedEntity } from './entity/post.liked.entity';
import { Repository } from 'typeorm';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';
import { NotifyService } from '../notify/notify.service';
import { TypeNotifyService } from '../typenotify/typenotify.service';
import { ConfigService } from '@nestjs/config';
import { URL_FRONTEND } from 'src/config/constants';

@Injectable()
export class PostlikedService {
    constructor(
        @InjectRepository(PostLikedEntity)
        private readonly postLikedRepository: Repository<PostLikedEntity>,
        @Inject(forwardRef(() => PostService))
        private readonly postService: PostService,
        private readonly userService: UserService,
        private readonly notifyService: NotifyService,
        @Inject(forwardRef(()=>TypeNotifyService))
        private readonly typeNotifyService: TypeNotifyService,
        private readonly configService:ConfigService,
    ) { }

    async addLikeToPost(userId: number, postId: number): Promise<{message:string, status:number} > {
        try {
            if (!userId || userId <= 0 || userId === undefined || userId === null || isNaN(userId)) {
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId = Number(postId);
            userId = Number(userId);
            const post = await this.postService.getPostById(postId);
            if (!post) {
                throw new BadRequestException('el post al que se le quiere dar like no existe');
            }
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new BadRequestException('el usuario que quiere dar like no existe');
            }
            const postLikedExist = await this.postLikedRepository.findOne({
                where: {
                    post: {
                        id: postId
                    },
                    user: {
                        id: userId
                    }
                }
            });
            if (postLikedExist) {
                throw new BadRequestException('el usuario ya le ha dado like a este post');
            };
            const postliked = this.postLikedRepository.create({
                post: post,
                user: user
            });
            const linkNotify=this.configService.get<string>(URL_FRONTEND);
            const linkSanead=linkNotify+'/posts/'+post.id;
             await this.postLikedRepository.save(postliked);
             const typeNotify=await this.typeNotifyService.getByType('informaacion')
                if(typeNotify){
                    await this.notifyService.createNotify({
                        title:'Nuevo Like en tu Publicación',
                        typeNotifyId:typeNotify.id,
                        usersIds:[post.user.id],
                        message:`El usuario ${user.username} le ha dado me gusta a tu publicación.`,
                        link:linkSanead
                    });
                }
            return { message: 'Like agregado correctamente', status: 201 };
        } catch (error) {
            throw error;
        }
    }

    async userLikedPost(userId: number, postId: number): Promise<boolean> {
        try {
            if (!userId || userId <= 0 || userId === undefined || userId === null || isNaN(userId)) {
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId = Number(postId);
            userId = Number(userId);
            const post = await this.postService.getPostById(postId);
            if (!post) {
                throw new BadRequestException('el post no existe');
            }
            const user = await this.userService.findById(userId);
            if (!user) {
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

    async removeLikeFromPost(userId: number, postId: number): Promise<{ message: string, status: number }> {
        try {
            if (!userId || userId <= 0 || userId === undefined || userId === null || isNaN(userId)) {
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId = Number(postId);
            userId = Number(userId);
            const post = await this.postService.getPostById(postId);
            if (!post) {
                throw new BadRequestException('el post al que se le quiere quitar el like no existe');
            }
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new BadRequestException('el usuario que quiere quitar el like no existe');
            }
            const postLiked = await this.postLikedRepository.findOne({
                where: {
                    post: {
                        id: postId,
                    },
                    user: {
                        id: userId,
                    },
                }
            });
            if (!postLiked) {
                throw new BadRequestException('el usuario no ha dado like a este post');
            }
            await this.postLikedRepository.remove(postLiked);
            return { message: 'Like eliminado correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }
    async counLtLikesForPost(postId:number):Promise<number>{
        try {
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId = Number(postId);
            const count = await this.postLikedRepository.count({
                where: {
                    post: {
                        id: postId
                    }
                }
            });
            return count;
        } catch (error) {
            throw error;
        }
    }
    async getLikesByPostId(postId:number):Promise<PostLikedEntity[]>{
        try{
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            postId = Number(postId);
            const likes= await this.postLikedRepository.find({
                where:{
                    post:{
                        id:postId
                    }
                },
                relations:{
                    user:true
                }
            });
            if(!likes || likes.length===0){
                throw new BadRequestException('el post no tiene likes');
            }
            const postWithOutUserInfo= likes.map(like=>{
                if(like.user){
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = like.user;
                    like.user = { id, username, profilePhoto, emailVerified, verified, createdAt } as any;
                }
                return like;
            });
            return postWithOutUserInfo;
        }catch(error){
            throw error;
        }
    }
}
