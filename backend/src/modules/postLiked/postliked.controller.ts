import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PostlikedService } from './postliked.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller('postliked')
export class PostlikedController {
    constructor(
        private readonly postLikedService: PostlikedService,
    ) { }

    @Get('userslike/:postId')
    async getUsersWhoLikedPost(@Param('postId') postId: number) {
        return this.postLikedService.getLikesByPostId(postId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('addlike/:postId')
    async addLikeToPost(@Req() req: any, @Param('postId') postId: number) {
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        return this.postLikedService.addLikeToPost(userId, postId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('removelike/:postId')
    async removeLikeFromPost(@Req() req: any, @Param('postId') postId: number) {
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        return this.postLikedService.removeLikeFromPost(userId, postId);
    }
}
