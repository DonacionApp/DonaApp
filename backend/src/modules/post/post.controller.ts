import { Controller, Post, UseGuards, UseInterceptors, Body, Req, UploadedFiles, BadRequestException, Get, Param, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { UpdatePostDto } from './dto/update.post.dto';

@Controller('post')
export class PostController {
    constructor(
        private readonly postService: PostService
    ) { }

    @Get('/all')
    async getAllPosts():Promise<any>{
        return this.postService.findAll();
    }

    @Get('user/:userId')
    async getPostsByUserId(@Param('userId')userId:number):Promise<any>{
        return this.postService.getPostsByUserId(userId);
    }

    @Get('/:id')
    async getPostById(@Param('id')id:number):Promise<any>{
        return this.postService.getPostById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/posts')
    async getMyPosts(@Req() req: any): Promise<any> {
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if (!userId) throw new BadRequestException('Usuario no identificado');
        return this.postService.getPostsByUserId(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/create')
    @UseInterceptors(FilesInterceptor('files'))
    async createPost(@Req() req: any, @Body() body: any, @UploadedFiles() files?: Express.Multer.File[]) {
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if(!userId)throw new BadRequestException('Usuario no identificado');
        const data = { ...body, userId };
        return await this.postService.createPost(data, files);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/delete/:id')
    async DeletePost(@Req() req: any,@Param('id')id:number):Promise<any>{
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if(!userId)throw new BadRequestException('Usuario no identificado');
        return this.postService.deletePost(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('update/:id')
    async updatePost(@Req() req:any, @Param('id')id:number, @Body() body: UpdatePostDto):Promise<any>{
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if(!userId)throw new BadRequestException('Usuario no identificado');
        return this.postService.updatePost(id, body, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('image/delete/:imageId/post/:postId')
    async deletePostImage(@Req() req:any, @Param('imageId')imageId:number, @Param('postId')postId:number):Promise<any>{
        const userFromToken = req && req.user ? req.user : null;
        const userId = userFromToken?.sub ?? userFromToken?.id ?? null;
        if(!userId)throw new BadRequestException('Usuario no identificado');
        return this.postService.deleteImageFromPost(postId,imageId, userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('admin/delete/:id')
    async AdminDeletePost(@Param('id')id:number):Promise<any>{
        return this.postService.deletePost(id, undefined,true);
    }
    
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('update/admin/:id')
    async updatePostAdmin( @Param('id')id:number, @Body() body: UpdatePostDto):Promise<any>{
        return this.postService.updatePost(id, body, undefined, true);
    }


}
