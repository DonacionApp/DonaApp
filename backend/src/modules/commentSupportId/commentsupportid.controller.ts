import { Body, Controller, Get, Param, Post, UseGuards, Req, Delete } from '@nestjs/common';
import { CommentsupportidService } from './commentsupportid.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { createCommentSupportIdDto } from './dto/create.comment.dto';
import { FilterSearchCommentSupportIdDto } from './dto/filter.search.dto';

@Controller('commentsupportid')
export class CommentsupportidController {
    constructor(
        private readonly commentSupportIdService:CommentsupportidService,
    ){}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('/user/:idUser')
    async getCommentsByUserId(@Param('idUser') idUser: number) {
        return this.commentSupportIdService.getCommentsByUserId(idUser);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/all')
    async getCallSites(@Body() dto: FilterSearchCommentSupportIdDto){
        return this.commentSupportIdService.getAllCommentsSupportId(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/update/:idComment')
    async updateCommentSupportId(@Param('idComment') idComment: number, @Body() dto:{newComment:string}){
        return this.commentSupportIdService.updateCommentSupportId(idComment, dto.newComment);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/accept/:idComment')
    async acceptCommentSupportId(@Param('idComment') idComment: number, @Req() req:any){
        const adminId = req.user?.sub || req.user?.id || req.user?.userId || null;
        return this.commentSupportIdService.acceptCommentSupportId(idComment, Number(adminId));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/reject/:idComment')
    async rejectCommentSupportId(@Param('idComment') idComment: number, @Body() dto:{reason:string}, @Req() req:any){
        const adminId = req.user?.sub || req.user?.id || req.user?.userId || null;
        return this.commentSupportIdService.rejectCommentSupportId(idComment, Number(adminId), dto.reason);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('/delete/:idComment')
    async deleteCommentSupportId(@Param('idComment') idComment: number){
        return this.commentSupportIdService.deleteCommentSupportId(idComment);
    }
}
