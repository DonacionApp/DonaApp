import { Controller, Get, Param } from '@nestjs/common';
import { StatusdonationService } from './statusdonation.service';

@Controller('statusdonation')
export class StatusdonationController {
    constructor (
        private readonly statusDonationService:StatusdonationService,
    ){}

    @Get()
    async findAll(){
        try {
            return await this.statusDonationService.findAll();
        } catch (error) {
            throw error;
        }
    }

    @Get(':id')
    async findById(@Param('id') id:number){
        try {
            return await this.statusDonationService.findById(id);
        } catch (error) {
            throw error;
        }
    }
}
