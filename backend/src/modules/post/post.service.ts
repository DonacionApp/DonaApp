import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { Repository } from 'typeorm';
import { ImagepostService } from '../imagepost/imagepost.service';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class PostService {
    constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository:Repository<PostEntity>,
    @Inject(forwardRef(() => ImagepostService))
    private readonly imagePostService:ImagepostService,
    private readonly tagsService:TagsService
    ){}

    async getPostById(id:number):Promise<PostEntity>{
        try {
            if(id<=0 || id===undefined || id===null || isNaN(id) || !id){
                throw new Error('El id del post es invalido');
            }
            const post= await this.postRepository.findOne({
                where:{id},
                relations:{
                    imagePost:true,
                    tags:{
                        tag:true
                    },
                    user:true
                }
            });
            if(!post){
                throw new NotFoundException('post no encontrado');
            }
            if (post.user && (post.user as any).password) {
                delete (post.user as any).password;
            }
            return post;
        } catch (error) {
            throw error;
        }
    }
}
