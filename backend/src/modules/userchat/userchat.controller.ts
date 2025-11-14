import { Controller, Get, Query, UseGuards, Req, Param, Body, Post, Delete } from '@nestjs/common';
import { UserchatService } from './userchat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { AddChatToUserDto } from './dto/add.to.chat.dto';

@Controller('userchat')
export class UserchatController {
	constructor(private readonly userchatService: UserchatService){}

	@UseGuards(JwtAuthGuard)
	@Get('my-chats')
	async getMyChats(
		@Req() req:any,
		@Query('limit') limit?: string,
		@Query('cursor') cursor?: string,
		@Query('search') search?: string,
		@Query('orderBy') orderBy?: string,
		@Query('order') order?: string,
	){
		const userId = req.user?.id;
		const options = { limit, cursor, search, orderBy, order };
		return await this.userchatService.getMyChatsByUserId(Number(userId), options);
	}

	@UseGuards(JwtAuthGuard)
	@Get('users-by-chat/:chatId')
	async getUsersByChat(
		@Param('chatId') chatId: string,
	){
		return await this.userchatService.getUsersChatByChatId(Number(chatId));
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Post('admin/add-user-to-chat/:chatId/')
	async addUserToChat(@Param('chatId') chatId: string,@Body() dto: AddChatToUserDto){
		dto.chatId = Number(chatId);
		return await this.userchatService.addUserToChat(dto);
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('admin')
	@Delete('admin/remove-user-from-chat/:chatId/user/:userId')
	async removeUserFromChat(@Param('chatId') chatId: string,@Param('userId') userId: string){
		return await this.userchatService.removeUserFromChat(Number(userId),Number(chatId) );
	}
}