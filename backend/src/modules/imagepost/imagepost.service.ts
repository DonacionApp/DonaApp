import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ImagePostEntity } from './entity/image.post.entity';
import { AddImageToPostDto } from './dto/add.image.to.post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostService } from '../post/post.service';

@Injectable()
export class ImagepostService {
    constructor(
        @InjectRepository(ImagePostEntity)
        private readonly imagePostRespository:Repository<ImagePostEntity>,
        @Inject(forwardRef(()=>PostService))
        private readonly postService:PostService
    ){}

    async addImageToPost(dto:AddImageToPostDto):Promise<ImagePostEntity>{
        try {
            if(!dto.imageUrl || dto.imageUrl.trim() === '' || dto.imageUrl===undefined || !dto.postId || dto.postId<=0 ){
                throw new BadRequestException('imagen o post no pueden ser nulos');
            }

            const postExists= await this.postService.getPostById(dto.postId);
            if(!postExists){
                throw new BadRequestException('El post al que se quiere agregar la imagen no existe');
            }
            const newImagePost= this.imagePostRespository.create({
                image:dto.imageUrl,
                post:{id:dto.postId}
            })
            return await this.imagePostRespository.save(newImagePost);
        } catch (error) {
            throw error;
        }
    }

    async deleteImageFromPost(postId:number,imageId:number):Promise<{message:string}>{
        try {
            const postExists= await this.postService.getPostById(postId);
            if(!postExists){
                throw new BadRequestException('El post no existe');
            }
            const imagePost= await this.imagePostRespository.findOne({
                where:{id:imageId},
                relations:{post:true}
            });
            if(!imagePost){
                throw new BadRequestException('La imagen no existe');
            }
            if(imagePost.post.id !== postId){
                throw new BadRequestException('La imagen no pertenece a este post');
            }
            await this.imagePostRespository.remove(imagePost);
            return {message:'Imagen eliminada correctamente'};
        } catch (error) {
            throw error;
        }
    }
}
