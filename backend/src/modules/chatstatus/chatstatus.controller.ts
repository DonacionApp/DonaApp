import { Controller, Get } from '@nestjs/common';
import { ChatstatusService } from './chatstatus.service';

@Controller('chatstatus')
export class ChatstatusController {
    constructor(
        private readonly chatstatusService: ChatstatusService,
    ){}

    @Get('status')
    async getChatStatus(){
        return await this.chatstatusService.getAllStatus();
    }
}
