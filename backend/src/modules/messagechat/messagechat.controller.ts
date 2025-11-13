import { Controller, Get, Param, Req, UseGuards, Query } from '@nestjs/common';
import { MessagechatService } from './messagechat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller('messagechat')
export class MessagechatController {
    constructor(
        private readonly messagechatService: MessagechatService
    ){}

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
}
