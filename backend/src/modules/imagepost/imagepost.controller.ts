import { Controller, Get, Param } from '@nestjs/common';
import { ImagepostService } from './imagepost.service';
import { ImagePostEntity } from './entity/image.post.entity';

@Controller('imagepost')
export class ImagepostController {
    constructor(
        private readonly imagepostService:ImagepostService
    ){}

    @Get(':postId/images')
    async getImagesFromPost(@Param('postId') postId: number): Promise<ImagePostEntity[]> {
        return this.imagepostService.getImagesFromPostId(postId);
    }

    @Get(':imagePostId/image')
    async getVideosFromPost(@Param('imagePostId') imagePostId: number): Promise<ImagePostEntity> {
        return this.imagepostService.getImagePostbyId(imagePostId);
    }
}
