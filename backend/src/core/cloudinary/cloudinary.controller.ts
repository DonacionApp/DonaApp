import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cloudinary')
export class CloudinaryController {
    constructor(
        private readonly cloudinaryService: CloudinaryService
    ){}

    @Post('upload/image')
    @UseInterceptors(FileInterceptor('profile'))
    async uploadFile(@Body('folder') folder:string, @UploadedFile() file: Express.Multer.File){
        if(file)console.log('archivo recibido en el controlador de cloudinary:');
        if(!file || !folder) {
            console.log('no se recibio archivo o carpeta');
            return;
        }
        return this.cloudinaryService.uploadImage(folder, file);
    }
}
