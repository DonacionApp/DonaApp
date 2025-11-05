import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
}
