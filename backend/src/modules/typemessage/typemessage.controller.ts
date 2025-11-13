import { Controller, Get } from '@nestjs/common';
import { TypemessageService } from './typemessage.service';

@Controller('typemessage')
export class TypemessageController {
    constructor(
        private readonly typemessageService: TypemessageService,
    ){}
    @Get('all')
    async getAllTypesMessages(){
        return await this.typemessageService.getAllTypesMessages();
    }
}
