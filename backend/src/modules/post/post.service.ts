import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { Repository } from 'typeorm';
import { ImagepostService } from '../imagepost/imagepost.service';
import { TagsService } from '../tags/tags.service';
import { PosttagsService } from '../posttags/posttags.service';
import { isArray } from 'class-validator';
import { TypepostService } from '../typepost/typepost.service';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>,
        @Inject(forwardRef(() => ImagepostService))
        private readonly imagePostService: ImagepostService,
        private readonly tagsService: TagsService,
        @Inject(forwardRef(() => PosttagsService))
        private readonly postTagsService: PosttagsService,
        @Inject(forwardRef(() => TypepostService))
        private readonly typePostService: TypepostService
    ) { }

    async getPostById(id: number): Promise<PostEntity> {
        try {
            if (id <= 0 || id === undefined || id === null || isNaN(id) || !id) {
                throw new Error('El id del post es invalido');
            }
            const post = await this.postRepository.findOne({
                where: { id },
                relations: {
                    imagePost: true,
                    tags: {
                        tag: true
                    },
                    user: true
                }
            });
            if (!post) {
                throw new NotFoundException('post no encontrado');
            }
            if (post.user) {
                const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user;
                post.user = { id, username, profilePhoto, emailVerified, verified, createdAt } as any;
            }

            return post;
        } catch (error) {
            throw error;
        }
    }

    async createPost(data: any, files?: Express.Multer.File | Express.Multer.File[]): Promise<PostEntity> {
        try {
            if (!data) throw new Error('Data es requerida para crear el post');
            const { tags, typePost, userId, user, ...rest } = data;

            if (!rest.title || !rest.message) {
                throw new Error('title y message son obligatorios');
            }
            if (data?.typePost && data?.typePost <= 0) {
                throw new BadRequestException('El tipo de post es invalido');
            }
            const typePostNormali = typePost ? (typeof typePost === 'number' ? { id: typePost } : (typePost.id ? { id: typePost.id } : (!isNaN(Number(typePost)) ? { id: Number(typePost) } : undefined))) : undefined;
            if (!typePostNormali) throw new BadRequestException('El tipo de post es invalido');
            const existTypePost = await this.typePostService.findById(typePostNormali.id);
            if (!existTypePost) throw new NotFoundException('El tipo de post no existe');

            const postPayload: any = {
                title: rest.title,
                message: rest.message,
                user: user && user.id ? { id: user.id } : (userId ? { id: userId } : undefined),
                typePost: existTypePost,
            };
            if (files && Array.isArray(files) && files.length > 0) {
                let largeFilesError: any[] = [];
                await Promise.all(files.map(async (file) => {
                    const fileSizeValidation = await this.imagePostService.verifyFileSize(file);
                    if ((fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 413) || (fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 415)) {
                        largeFilesError.push(fileSizeValidation);
                    }
                }));
                if (largeFilesError.length > 0) {
                    const errorMessages = largeFilesError.map(err => err.message).join('; ');
                    throw new HttpException({ message: `Algunos archivos son demasiado grandes: ${errorMessages}`, details: largeFilesError }, 413);
                }
            } else if (files && !Array.isArray(files)) {
                const fileSizeValidation = await this.imagePostService.verifyFileSize(files);
                if ((fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 413) || (fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 415)) {
                    throw new HttpException({ message: `El archivo es demasiado grande`, details: [fileSizeValidation] }, 413);
                }
            } else {
                // no files provided; nothing to validate
            }


            if (!postPayload.user) {
                throw new Error('User (userId o user.id) es requerido para crear post');
            }

            const newPost = this.postRepository.create(postPayload);
            const savedPost = await this.postRepository.save(newPost);
            const postId = (savedPost as any).id;

            if (tags) {
                let tagsArr: any[] = [];
                if (Array.isArray(tags)) tagsArr = tags;
                else if (typeof tags === 'string') tagsArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);

                for (const t of tagsArr) {
                    try {
                        if (!t) continue;
                        if (!isNaN(Number(t))) {
                            const tagId = Number(t);
                            await this.postTagsService.createPostTag(postId, tagId);
                        } else {
                            let tagEntity;
                            try {
                                tagEntity = await this.tagsService.getTabByName(t);
                            } catch (err) {
                                tagEntity = await this.tagsService.createTag(t);
                            }
                            if (tagEntity && tagEntity.id) {
                                await this.postTagsService.createPostTag(postId, tagEntity.id);
                            }
                        }
                    } catch (err) {
                        const msg = (err && err.message) ? err.message : '';
                        if (!msg.includes('la relacion post-tag ya existe')) {
                            throw err;
                        }
                    }
                }
            }

            if (files && Array.isArray(files) && files.length > 0) {
                for (const file of files) {
                    await this.imagePostService.addImageToPost(postId, file);
                }
            }

            return await this.getPostById(postId);
        } catch (error) {
            throw error;
        }
    }

    async findAll(): Promise<PostEntity[]> {
        try {
            const posts= await this.postRepository.find({
                relations:{
                    imagePost:true,
                    tags:{
                        tag:true,
                    },
                    user:true
                }
            });
            if(!posts || posts.length===0){
                throw new NotFoundException('No se encontraron posts');
            }
            const postsWithUserInfo = posts.map(post => {
                if (post.user) {
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user;
                    post.user = { id, username, profilePhoto, emailVerified, verified, createdAt } as any;
                }
                return post;
            });

            return postsWithUserInfo;
        } catch (error) {
            throw error;
        }
    }

    async deletePost(id:number,userId?:number, admin?:boolean):Promise<{massage:string}>{
        try {
            if(!id || id<=0 || id===null || id===undefined){
                throw new BadRequestException('ID de post inválido');
            }
            id=Number(id);
            const post =await this.getPostById(id);
            if(!post){
                throw new NotFoundException('Post no encontrado');
            }
            if(userId && post.user && post.user.id !== userId && !admin){
                throw new BadRequestException('No tienes permiso para eliminar este post');
            }
            const imagePost= post.imagePost;
            if(imagePost && imagePost.length>0){
                for(const img of imagePost){
                    await this.imagePostService.deleteImageFromPost(id,img.id);
                }
            }
            await this.postRepository.delete(id);
            return { massage: 'Post eliminado correctamente' };
        } catch (error) {
            throw error;
        }
    }

    async getPostsByUserId(userId:number):Promise<PostEntity[]>{
        try {
            if(!userId || userId<=0 || userId===null || userId===undefined){
                throw new BadRequestException('ID de usuario inválido');
            }
            const postUser= await this.postRepository.find({
                where:{
                    user:{
                        id:userId
                    }
                },
                relations:{
                    imagePost:true,
                    tags:{
                        tag:true
                    },
                    user:true
                }
            });
            if(!postUser || postUser.length===0){
                throw new NotFoundException('El usuario no tiene posts');
            }
            const postsWithUserInfo = postUser.map(post => {
                if (post.user) {
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user;
                    post.user = { id, username, profilePhoto, emailVerified, verified, createdAt } as any;
                }
                return post;
            });
            return postsWithUserInfo;
        } catch (error) {
            throw error;
        }
    }

}
