import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

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
}
