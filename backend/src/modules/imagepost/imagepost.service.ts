import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ImagePostEntity } from './entity/image.post.entity';
import { AddImageToPostDto } from './dto/add.image.to.post.dto';

@Injectable()
export class ImagepostService {
    constructor(
        private readonly imagePostRespository:Repository<ImagePostEntity>
    ){}

    async addImageToPost(dto:AddImageToPostDto):Promise<ImagePostEntity>{
        try {
            if(!dto.imageUrl || dto.imageUrl.trim() === '' || dto.imageUrl===undefined || !dto.postId || dto.postId<=0 ){
                throw new BadRequestException('imagen o post no pueden ser nulos');
            }

            //mas adelante manejar logica para verificar que el post exista
            const newImagePost= this.imagePostRespository.create({
                image:dto.imageUrl,
                post:{id:dto.postId}
            })
            return await this.imagePostRespository.save(newImagePost);
        } catch (error) {
            throw error;
        }
    }
}
