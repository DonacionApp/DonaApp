import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { Repository } from 'typeorm';
import { ImagepostService } from '../imagepost/imagepost.service';
import { TagsService } from '../tags/tags.service';
import { PosttagsService } from '../posttags/posttags.service';
import { isArray } from 'class-validator';

@Injectable()
export class PostService {
    constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository:Repository<PostEntity>,
    @Inject(forwardRef(() => ImagepostService))
    private readonly imagePostService:ImagepostService,
    private readonly tagsService:TagsService,
    @Inject(forwardRef(() => PosttagsService))
    private readonly postTagsService: PosttagsService
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

    async createPost(data: any, files?: Express.Multer.File[]): Promise<PostEntity>{
        try{
            if(!data) throw new Error('Data es requerida para crear el post');
            const { tags, typePost, userId, user, ...rest } = data;

            if(!rest.title || !rest.message) {
                throw new Error('title y message son obligatorios');
            }

            const postPayload: any = {
                title: rest.title,
                message: rest.message,
                user: user && user.id ? { id: user.id } : (userId ? { id: userId } : undefined),
                typePost: typePost ? (typeof typePost === 'number' ? { id: typePost } : (typePost.id ? { id: typePost.id } : undefined)) : undefined,
            };
            if(files && Array.isArray(files) && files.length>0){
                let largeFilesError: any[] = [];
                await Promise.all(files.map(async(file)=>{
                    const fileSizeValidation= await this.imagePostService.verifyFileSize(file);
                    if(fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status===413){
                        largeFilesError.push(fileSizeValidation);
                    }
                }));
                if(largeFilesError.length>0){
                    const errorMessages = largeFilesError.map(err => err.message).join('; ');
                    throw new Error(`Algunos archivos son demasiado grandes: ${errorMessages}`);
                }
            }
            

            if(!postPayload.user) {
                throw new Error('User (userId o user.id) es requerido para crear post');
            }

            const newPost = this.postRepository.create(postPayload);
            const savedPost = await this.postRepository.save(newPost);
            const postId = (savedPost as any).id;

            if(tags){
                let tagsArr: any[] = [];
                if(Array.isArray(tags)) tagsArr = tags;
                else if(typeof tags === 'string') tagsArr = tags.split(',').map((t:string)=>t.trim()).filter(Boolean);

                for(const t of tagsArr){
                    try{
                        if(!t) continue;
                            if(!isNaN(Number(t))){
                            const tagId = Number(t);
                            await this.postTagsService.createPostTag(postId, tagId);
                        } else {
                            let tagEntity;
                            try{
                                tagEntity = await this.tagsService.getTabByName(t);
                            }catch(err){
                                tagEntity = await this.tagsService.createTag(t);
                            }
                            if(tagEntity && tagEntity.id){
                                await this.postTagsService.createPostTag(postId, tagEntity.id);
                            }
                        }
                    }catch(err){
                        const msg = (err && err.message) ? err.message : '';
                        if(!msg.includes('la relacion post-tag ya existe')){
                            throw err;
                        }
                    }
                }
            }

            if(files && Array.isArray(files) && files.length>0){
                for(const file of files){
                    await this.imagePostService.addImageToPost(postId, file);
                }
            }

            return await this.getPostById(postId);
        }catch(error){
            throw error;
        }
    }
}
