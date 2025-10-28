import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, DeleteApiResponse, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { error } from 'console';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class CloudinaryService {
    constructor(
        private readonly configService: ConfigService,
    ){}

    async uploadFile(folder:string, file: Express.Multer.File):Promise<UploadApiResponse | UploadApiErrorResponse>{
        console.log('subiendo imagen a la carpeta ', folder)
        return new Promise((resolve,reject)=>{
            const upload=cloudinary.uploader.upload_stream(
                {folder:folder},
                (error,result)=>{
                    if(error) return reject(error);
                    resolve (result!);
                }
            );
            const readableStream=Readable.from(file.buffer);
            readableStream.pipe(upload);
        })
    }

    async deleteFile(folder:string, publicId:string):Promise<DeleteApiResponse | UploadApiErrorResponse>{
        console.log('eliminando imagen de la carpeta ', folder)
        const publicIdFull=`${folder}/${publicId}`;
        return new Promise((resolve,reject)=>{
            cloudinary.uploader.destroy(publicIdFull, (error,result)=>{
                if(error) return reject(error);
                resolve (result!);
            });
        })
    }

    async uploadImage(folder:string, file:Express.Multer.File):Promise<UploadApiErrorResponse | UploadApiResponse>{
        if(!file) throw new Error('No file provided');

        const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
        const allowedImageTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml'
        ];

        this.validateFile(file, allowedImageTypes, MAX_IMAGE_BYTES);
        return this.uploadFile(folder, file);
    }

    async uploadVideo(folder:string, file:Express.Multer.File):Promise<UploadApiErrorResponse | UploadApiResponse>{
        if(!file) throw new Error('No file provided');

        const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
        const allowedVideoTypes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/webm',
            'video/mpeg',
            'video/3gpp'
        ];

        this.validateFile(file, allowedVideoTypes, MAX_VIDEO_BYTES);
        return this.uploadFile(folder, file);
    }

    async uploadPDF(folder:string, file:Express.Multer.File):Promise<UploadApiErrorResponse | UploadApiResponse>{
        if(!file) throw new Error('No file provided');

        const MAX_PDF_BYTES = 1 * 1024 * 1024; // 1 MB
        const allowedPdfTypes = [
            'application/pdf'
        ];

        this.validateFile(file, allowedPdfTypes, MAX_PDF_BYTES);
        return this.uploadFile(folder, file);
    }

    // Reusable validator used by uploadImage/uploadVideo/uploadPDF
    private validateFile(file: Express.Multer.File, allowedTypes: string[], maxBytes: number){
        if(!file) throw new Error('No file provided');
        if(!file.mimetype) throw new Error('File has no mimetype');
        if(!allowedTypes.includes(file.mimetype)){
            throw new Error(`Invalid file type: ${file.mimetype}`);
        }
        if(!file.buffer || !(file.buffer instanceof Buffer)){
            throw new Error('Invalid file buffer');
        }
        if(file.buffer.length > maxBytes){
            const maxMB = (maxBytes / (1024 * 1024));
            const actualKB = Math.round(file.buffer.length / 1024);
            throw new Error(`File too large: ${actualKB} KB. Max ${maxMB} MB`);
        }
    }
    
        
}
