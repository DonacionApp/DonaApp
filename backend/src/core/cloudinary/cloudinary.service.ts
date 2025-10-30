import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, DeleteApiResponse, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { error } from 'console';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class CloudinaryService {
    constructor(
        private readonly configService: ConfigService,
    ) { }

    private async uploadFile(folder: string, file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        console.log('subiendo imagen a la carpeta ', folder)
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { folder: folder },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                }
            );
            const readableStream = Readable.from(file.buffer);
            readableStream.pipe(upload);
        })
    }

    async deleteFile(folder: string, publicId: string): Promise<DeleteApiResponse | UploadApiErrorResponse> {
        if (!folder || !publicId) {
            throw new BadRequestException('No folder or publicId provided');
        }
        const publicIdFull = `${folder}/${publicId}`;
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicIdFull, (error, result) => {
                if (error) return reject(error);
                resolve(result!);
            });
        })
    }

    async validateTamaño(file: Express.Multer.File): Promise<any> {
        const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
        const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 10 MB
        const MAX_PDF_BYTES = 1 * 1024 * 1024; // 1 MB
        const fileType = file.mimetype.split('/')[0];
        switch (fileType) {
            case 'image':
                if (file.buffer.length > MAX_IMAGE_BYTES) {
                    const actualKB = Math.round(file.buffer.length / 1024);
                    return { message: (`File muy grande: ${actualKB} KB. Max 1 MB`), file: file.filename, status: 413 };
                }
                break;
            case 'video':
                if (file.buffer.length > MAX_VIDEO_BYTES) {
                    const actualKB = Math.round(file.buffer.length / 1024);
                    return { message: (`File muy grande: ${actualKB} KB. Max 10 MB`), file: file.originalname, status: 413 };
                }
                break;
            case 'pdf':
                if (file.buffer.length > MAX_PDF_BYTES) {
                    const actualKB = Math.round(file.buffer.length / 1024);
                    return { message: (`File muy grande: ${actualKB} KB. Max 1 MB`), file: file.originalname, status: 413 };
                }
                break;
            default:
                return { message: (`Tipo de archivo no soportado: ${file.mimetype}`), file: file.originalname, status: 415 };
                break;
        }
    }

    async uploadImage(folder: string, file: Express.Multer.File): Promise<UploadApiErrorResponse | UploadApiResponse> {
        try {
            if (!file || !folder) {
                throw new BadRequestException('No file or folder provided');
            }

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
        } catch (error) {
            throw error;
        }

    }

    async uploadVideo(folder: string, file: Express.Multer.File): Promise<UploadApiErrorResponse | UploadApiResponse> {
        try {
            if (!file || !folder) {
                throw new BadRequestException('No file or folder provided');
            }
            const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 50 MB
            const allowedVideoTypes = [
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo',
                'video/x-ms-wmv',
                'video/webm',
                'video/mpeg',
                'video/3gpp'
            ];

            await this.validateFile(file, allowedVideoTypes, MAX_VIDEO_BYTES);
            return this.uploadFile(folder, file);
        } catch (error) {
            throw error;
        }

    }

    async uploadPDF(folder: string, file: Express.Multer.File): Promise<UploadApiErrorResponse | UploadApiResponse> {
        try {
            if (!file || !folder) {
                throw new BadRequestException('No file or folder provided');
            }

            const MAX_PDF_BYTES = 1 * 1024 * 1024; // 1 MB
            const allowedPdfTypes = [
                'application/pdf'
            ];

            this.validateFile(file, allowedPdfTypes, MAX_PDF_BYTES);
            return this.uploadFile(folder, file);
        } catch (error) {
            throw error;
        }

    }

    private validateFile(file: Express.Multer.File, allowedTypes: string[], maxBytes: number) {
        try {
            if (!file) throw new NotFoundException('No file provided');
            if (!file.mimetype) throw new BadRequestException('File has no mimetype');
            if (!allowedTypes.includes(file.mimetype)) {
                throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
            }
            if (!file.buffer || !(file.buffer instanceof Buffer)) {
                throw new BadRequestException('Invalid file buffer');
            }
            if (file.buffer.length > maxBytes) {
                const maxMB = (maxBytes / (1024 * 1024));
                const actualKB = Math.round(file.buffer.length / 1024);
                throw new BadRequestException(`File too large: ${actualKB} KB. Max ${maxMB} MB`);
            }
        } catch (error) {
            throw error;
        }

    }


}
