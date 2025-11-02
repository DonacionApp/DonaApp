import { Controller, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { IaService } from './ia.service';
import {  FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@Controller('ia')
export class IaController {
    constructor(
        private readonly iaService: IaService
    ) { }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files'))
    @Post('tags-from-images')
    async getTagsFromImages(@UploadedFiles() files:Express.Multer.File[]): Promise<string[]> {
        console.log('Archivos recibidos en el controlador IA:', files);
        return this.iaService.getTagsFromImages(files);
    }

}
