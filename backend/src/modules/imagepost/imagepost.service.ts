import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ImagePostEntity } from './entity/image.post.entity';
import { AddImageToPostDto } from './dto/add.image.to.post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostService } from '../post/post.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { CLOUDINARY_FOLDER_BASE, CLOUDINARY_POST_FOLDER } from 'src/config/constants';

@Injectable()
export class ImagepostService {
    constructor(
        @InjectRepository(ImagePostEntity)
        private readonly imagePostRespository: Repository<ImagePostEntity>,
        @Inject(forwardRef(() => PostService))
        private readonly postService: PostService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly configService: ConfigService
    ) { }

    async addImageToPost(postId: number, file: Express.Multer.File): Promise<ImagePostEntity> {
        try {
            if (!file || !postId || postId <= 0) {
                throw new BadRequestException('imagen o post no pueden ser nulos');
            }
            if (!file) {
                throw new BadRequestException('La imagen es obligatoria');
            }

            const postExists = await this.postService.getPostById(postId);
            if (!postExists) {
                throw new BadRequestException('El post al que se quiere agregar la imagen no existe');
            }
            const fileType = file.mimetype.split('/')[0];
            const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
            const folderPost = this.configService.get<string>(CLOUDINARY_POST_FOLDER);
            if (!folderBase || !folderPost) {
                throw new BadRequestException('La configuracion de carpetas en cloudinary es invalida');
            }
            const folder = `${folderBase}/${folderPost}/post_${postId}`;
            let url = null
            switch (fileType) {
                case 'image':
                    const uploadResult = await this.cloudinaryService.uploadImage(folder, file);
                    url = uploadResult.secure_url;
                    break;
                case 'video':
                    const uploadVideoResult = await this.cloudinaryService.uploadVideo(folder, file);
                    url = uploadVideoResult.secure_url;
                    break;
                default:
                    throw new BadRequestException('Tipo de archivo no soportado. Solo se permiten imagenes y videos.');
            }
            if(!url){
                throw new BadRequestException('Error al subir la imagen al servicio de almacenamiento');
            }
            const newImagePost = this.imagePostRespository.create({
                image: url,
                post: { id: postId }
            })

            return await this.imagePostRespository.save(newImagePost);
        } catch (error) {
            throw error;
        }
    }

    async deleteImageFromPost(postId: number, imageId: number): Promise<{ message: string }> {
        try {
            const postExists = await this.postService.getPostById(postId);
            if (!postExists) {
                throw new BadRequestException('El post no existe');
            }
            const imagePost = await this.imagePostRespository.findOne({
                where: { id: imageId },
                relations: { post: true }
            });
            if (!imagePost) {
                throw new BadRequestException('La imagen no existe');
            }
            if (imagePost.post.id !== postId) {
                throw new BadRequestException('La imagen no pertenece a este post');
            }
            const folderBase = this.configService.get<string>(CLOUDINARY_FOLDER_BASE);
            const folderPost = this.configService.get<string>(CLOUDINARY_POST_FOLDER);
            if (!folderBase || !folderPost) {
                throw new BadRequestException('La configuracion de carpetas en cloudinary es invalida');
            }
            const folder = `${folderBase}/${folderPost}/post_${postId}`;
            const publicId = imagePost.image.split('/').pop()?.split('.').shift();
            if (!publicId) {
                throw new BadRequestException('No se pudo obtener el publicId de la imagen');
            }
            await this.cloudinaryService.deleteFile(folder, publicId);
            await this.imagePostRespository.remove(imagePost);
            return { message: 'Imagen eliminada correctamente' };
        } catch (error) {
            throw error;
        }
    }

    async getImagesFromPostId(postId:number):Promise<ImagePostEntity[]>{
        try {
            if(!postId || postId<=0 || postId===null || postId===undefined){
                throw new BadRequestException('ID de post inválido');
            }
            const images = await this.imagePostRespository.find({
                where: { post: { id: postId } },
                relations: { post: true }
            });
            if(!images || images.length===0){
                throw new BadRequestException('No hay imágenes para este post');
            }
            return images;
        } catch (error) {
            throw error;
        }
    }

    async getImagePostbyId(id:number):Promise<ImagePostEntity>{
        try {
            if(!id || id<=0 || id===null || id===undefined){
                throw new BadRequestException('ID de imagen inválido');
            }
            const imagePost = await this.imagePostRespository.findOne({
                where:{
                    id:id
                },
                relations:{
                    post:true
                }
            });
            if(!imagePost){
                throw new BadRequestException('La imagen no existe');
            }
            if(!imagePost.post){
                throw new BadRequestException('La imagen no está asociada a ningún post');
            }
            return imagePost;
        } catch (error) {
            throw error;
        }
    }
}
