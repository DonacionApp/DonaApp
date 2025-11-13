import { Controller, Get, Query, UseGuards, Req, Param } from '@nestjs/common';
import { UserchatService } from './userchat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

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
}