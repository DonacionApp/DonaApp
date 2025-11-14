import { Controller, Get, Param, Req, UseGuards, Query, Post, Body, BadRequestException, Put } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CreateChatDto } from './dto/create.chat.dto';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get('chat-from-donation/:donationId')
    async getChatFromDonation(@Param('donationId') donationId: string, @Req() req?: any) {
        const currentUser = req?.user?.id;
        return await this.chatService.getChatFronDonationId(Number(donationId), currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/all/me')
    async getChatsByUserId(@Req() req?: any, @Query() query?: any) {
        const userId = req?.user?.id;
        const options = {
            searchParam: query?.searchParam,
            cursor: query?.cursor,
            limit: query?.limit,
            page: query?.page,
            offset: query?.offset,
        };
        return await this.chatService.getChatsByUserId(Number(userId), options as any);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/admin/list')
    async getAllChatsAdmin(@Req() req?: any, @Body() body?: any, @Query() query?: any) {
        const user = req?.user;

        const options = {
            limit: query?.limit,
            page: query?.page,
            offset: query?.offset,
            cursor: query?.cursor,
            orderBy: query?.orderBy,
            order: query?.order,
        };

        const result = await this.chatService.getAllChatsAdmin(body, options as any);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id/close')
    async closeChat(@Param('id') id: string, @Req() req?: any, @Body() body?: any) {
        const user = req?.user;
        return await this.chatService.closeChat(Number(id), user?.id, false);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Put(':id/close/admin')
    async closeChatAdmin(@Param('id') id: string, @Req() req?: any) {
        const user = req?.user;
        return await this.chatService.closeChat(Number(id), user?.id, true);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('/admin/admin/create/')
    async createChatAdmin(@Req() req: any, @Body() body: CreateChatDto) {
        const user = req?.user;
        return await this.chatService.createChat(body, true);
    }
}
