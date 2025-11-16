import { Controller, Get, Param, Req, UseGuards, Query, Body, Post, UseInterceptors, UploadedFiles, Put, Delete } from '@nestjs/common';
import { MessagechatService } from './messagechat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CreateMessageDto } from './dto/create.message.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('messagechat')
export class MessagechatController {
    constructor(
        private readonly messagechatService: MessagechatService
    ){}

    @UseGuards(JwtAuthGuard)
    @Get('unread/count')
    async getCountUnreadMessages(@Req() req?: any) {
        const currentUser = req?.user?.id;
        return this.messagechatService.getCountUnreadMessages(currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Post('send/new/message/')
    @UseInterceptors(FilesInterceptor('files'))
    async sendNewMessage(@Body() body: any,@Req() req?: any,@UploadedFiles() files?: Express.Multer.File[],){
        const currentUser = req?.user?.id;
        const dto: CreateMessageDto = {
            chatId: body?.chatId ? Number(body.chatId) : undefined,
            typeMessageId: body?.typeMessageId ? Number(body.typeMessageId) : undefined,
            messageText: typeof body?.messageText === 'string' ? body.messageText : undefined,
        } as any;

        return await this.messagechatService.createMessageChat(currentUser, dto, files);
    }

    @UseGuards(JwtAuthGuard)
    @Get('by-chat/:chatId')
    async getMessagesByChatId(
        @Param('chatId') chatId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('searchParam') searchParam?: string,
        @Query('type') type?: string,
        @Query('order') order?: string,
        @Req() req?: any,
    ){
        const currentUser = req?.user?.id;

        const opts: any = {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            searchParam: (searchParam && searchParam.trim().length>0) ? searchParam : (search && search.trim().length>0 ? search : undefined),
            type: typeof type !== 'undefined' && type !== null && type !== '' ? (isNaN(Number(type)) ? type : Number(type)) : undefined,
            order: order && String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        };


        return await this.messagechatService.getMessagesByChatId(Number(chatId), currentUser, undefined, opts);
    }

    @UseGuards(JwtAuthGuard)
    @Put('update/message/:id/chat')
    async updateMessage(@Param('id') id: number, @Body() body:{newMessage:string}, @Req() req?: any){
        const currentUser = req?.user?.id;
        return this.messagechatService.updateMessageChat(id, body.newMessage, currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete/message/:id/chat')
    async deleteMessage(@Param('id') id: number, @Req() req?: any){
        const currentUser = req?.user?.id;
        return this.messagechatService.deleteMessageChat(id, currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Put('mark-as-read/chat/:chatId')
    async markMessagesAsRead(@Param('chatId') chatId: number, @Req() req?: any){
        const currentUser = req?.user?.id;
        return this.messagechatService.markMessagesAsRead(chatId, currentUser);
    }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Delete('admin/delete/message/:id/chat')
    @Roles('admin')
    async deleteMessageAdmin(@Param('id') id: number, @Req() req?: any){
        const currentUserId= req?.user?.id
        return this.messagechatService.deleteMessageChat(id, currentUserId, true);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin/by-chat/:chatId')
    async getMessagesByChatIdAdmin(
        @Param('chatId') chatId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('searchParam') searchParam?: string,
        @Query('type') type?: string,
        @Query('order') order?: string,
        @Req() req?: any,
    ){
        const currentUser = req?.user?.id;

        const opts: any = {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            searchParam: (searchParam && searchParam.trim().length>0) ? searchParam : (search && search.trim().length>0 ? search : undefined),
            type: typeof type !== 'undefined' && type !== null && type !== '' ? (isNaN(Number(type)) ? type : Number(type)) : undefined,
            order: order && String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        };


        return await this.messagechatService.getMessagesByChatId(Number(chatId), currentUser, true, opts);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/admin/send/new/message/')
    @UseInterceptors(FilesInterceptor('files'))
    async sendNewMessageAdmin(@Body() body: any,@Req() req?: any,@UploadedFiles() files?: Express.Multer.File[],){
        const currentUser = req?.user?.id;
        const dto: CreateMessageDto = {
            chatId: body?.chatId ? Number(body.chatId) : undefined,
            typeMessageId: body?.typeMessageId ? Number(body.typeMessageId) : undefined,
            messageText: typeof body?.messageText === 'string' ? body.messageText : undefined,
        } as any;

        return await this.messagechatService.createMessageChat(currentUser, dto, files, true);
    }
}
