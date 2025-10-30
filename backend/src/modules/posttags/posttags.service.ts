import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostTagEntity } from './entity/post.tags.entity';
import { Repository } from 'typeorm';
import { TagsService } from '../tags/tags.service';

@Injectable()
export class PosttagsService {
    constructor(
        @InjectRepository(PostTagEntity)
        private readonly postTagRepsitory: Repository<PostTagEntity>,
        private readonly tagService: TagsService
    ) { }

    /*async createTagIfNotExists(tagName:string):Promise<PostTagEntity>{    
        try {
            if(!tagName)throw new BadRequestException('tag es requerida');
            const tag  = await this.tagService.getTabByName(tagName);
            if(tag){
                const 
            };
            const newTag= await this.tagService.createTag(tagName);

        } catch (error) {
            throw error;
        }
    }*/

    async createPostTag(postId: number, tagId: number): Promise<PostTagEntity> {
        try {
            if (!postId || isNaN(postId) || postId <= 0 || postId===undefined) throw new BadRequestException('postId es requerido');
            if (!tagId || isNaN(tagId) || tagId <= 0 || tagId===undefined) throw new BadRequestException('tagid es obligatorio');
            const postTag = this.postTagRepsitory.create({ post: { id: postId }, tag: { id: tagId } });
            return await this.postTagRepsitory.save(postTag);
        } catch (error) {
            throw error;
        }
    }

    async deleteTagFromPost(postId: number, tagId: number): Promise<{ message: string, status: number }> {
        try {
            if (!postId || isNaN(postId) || postId <= 0 || postId===undefined) throw new BadRequestException('postId es requerido');
            if (!tagId || isNaN(tagId) || tagId <= 0 || tagId===undefined) throw new BadRequestException('tagid es obligatorio');
            const exists = await this.postTagRepsitory.findOne({ where: { post: { id: postId }, tag: { id: tagId } } });
            if (!exists) throw new BadRequestException('la relacion post-tag no existe');
            await this.postTagRepsitory.delete(exists.id);
            return { message: 'tag eliminado del post correctamente', status: 200 };

        } catch (error) {
            throw error;
        }
    }

    async getTagsByPostId(postId: number): Promise<PostTagEntity[]> {
        try {
            if (!postId || isNaN(postId) || postId <= 0 || postId===undefined) throw new BadRequestException('postId es requerido');
            return await this.postTagRepsitory.find({
                where: {
                    post: {
                        id: postId
                    }
                },
                relations: {
                    tag: true,

                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getPostsbyTagId(tagId: number): Promise<any[]> {
        try {
            if (!tagId || isNaN(tagId) || tagId <= 0 || tagId===undefined) throw new BadRequestException('tagId es requerido');
            const posts= await this.postTagRepsitory.find({
                where: {
                    tag: { id: tagId }
                },
                relations: {
                    post: {
                        user: true
                    },
                    tag: true
                }
            });
            if(!posts) throw new BadRequestException('no se encontraron posts con ese tag');
            const safeOnlyPosts = posts.map(pt => {
                const post = pt.post;
                if (post && post.user) {
                    const { password,email,token, loginAttempts,lockUntil, dateSendCodigo,code,block,createdAt,updatedAt, ...userWithoutPassword } = post.user;
                    return { ...post, user: userWithoutPassword };
                }
                return post;
            });

            return safeOnlyPosts;
        } catch (error) {
            throw error;
        }
    }

}
