import { Controller, Get, Param } from '@nestjs/common';
import { PosttagsService } from './posttags.service';

@Controller('posttags')
export class PosttagsController {
    constructor(
        private readonly postTagsService: PosttagsService
    ) { }

    @Get(':tagId/posts')
    async getPostsByTagId(@Param('tagId') tagId: number): Promise<any[]> {
        try {
            return this.postTagsService.getPostsbyTagId(tagId);
        } catch (error) {
            throw error;
        }
    }
    @Get('post/:postId/tags')
    async getTagsByPostId(@Param('postId') postId: number) {
        try {
            return this.postTagsService.getTagsByPostId(postId);
        } catch (error) {
            throw error;
        }
    }
}
