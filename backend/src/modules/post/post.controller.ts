import { Controller, Post, UseGuards, UseInterceptors, Body, Req, UploadedFiles, BadRequestException, Get, Param, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('post')
export class PostController {
    constructor(
        private readonly postService: PostService
    ) { }

    @Get('/all')
    async getAllPosts():Promise<any>{
        return this.postService.findAll();
    }

    @Get('/:id')
    async getPostById(@Param('id')id:number):Promise<any>{
        return this.postService.getPostById(id);
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('admin/delete/:id')
    async AdminDeletePost(@Param('id')id:number):Promise<any>{
        return this.postService.deletePost(id, undefined,true);
    }
}
