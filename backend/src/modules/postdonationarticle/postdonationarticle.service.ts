import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostArticleDonationEntity } from './entity/post.article.donation.entity';
import { Repository } from 'typeorm';
import { PostService } from '../post/post.service';
import { PostarticleService } from '../postarticle/postarticle.service';
import { FilterSearchPostDonationArticleDto } from './dto/filter.search.dto';
import { AddArticleToDonationFromPost } from './dto/add.aticle.to.donation.dto';
import { DonationService } from '../donation/donation.service';
import { StatusdonationService } from '../statusdonation/statusdonation.service';
import { ModifyQuantityPostdonationarticleService } from './dto/modify.quantity.donation.article.dto';
import { StatusarticledonationService } from '../statusarticledonation/statusarticledonation.service';
import { DonationEntity } from '../donation/entity/donation.entity';

@Injectable()
export class PostdonationarticleService {
    constructor(
        @InjectRepository(PostArticleDonationEntity)
        private readonly postDonationArticleRepository: Repository<PostArticleDonationEntity>,
        @Inject(forwardRef(()=>DonationService))
        private readonly donationService: DonationService,
        private readonly postArticleService: PostarticleService,
        private readonly statusDonationService: StatusdonationService,
        @Inject(forwardRef(() => StatusarticledonationService))
        private readonly statusPostArticleService:StatusarticledonationService,
        private readonly postService: PostService,
    ) { }

    async getAllArticlesFromDonation(filter: FilterSearchPostDonationArticleDto): Promise<any> {
        try {
            const qb = this.postDonationArticleRepository
                .createQueryBuilder('pad')
                .leftJoinAndSelect('pad.donation', 'donation')
                .leftJoinAndSelect('pad.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.post', 'post')
                .leftJoinAndSelect('postArticle.status', 'status')
                .leftJoinAndSelect('donation.user', 'donationUser')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('postArticle.article', 'article');

            if (filter.donationId) {
                qb.andWhere('pad.donationId = :donationId', { donationId: filter.donationId });
            }
            if (filter.postId) {
                qb.andWhere('post.id = :postId', { postId: filter.postId });
            }
            if (filter.postArticleId) {
                qb.andWhere('pad.postArticleId = :postArticleId', { postArticleId: filter.postArticleId });
            }
            if (filter.search) {
                qb.andWhere('(post.title ILIKE :search OR post.message ILIKE :search OR article.name ILIKE :search OR article.descripcion ILIKE :search)', { search: `%${filter.search}%` });
            }

            const rows = await qb.getMany();

            const articles = rows.map((item) => {
                const art = item.postArticle?.article as any;
                return {
                    id: item.id,
                    quantity: item.quantity,
                    postArticleId: item.postArticle?.id ?? null,
                    article: art
                        ? {
                              id: art.id,
                              name: art.name,
                              descripcion: art.descripcion,
                              createdAt: art.createdAt,
                              updatedAt: art.updatedAt,
                          }
                        : null,
                };
            });
            if (filter.postId && rows.length > 0) {
                const p = (rows[0].postArticle as any)?.post;
                const postOnce = p
                    ? {
                          id: p.id,
                          title: p.title,
                          message: p.message,
                          createdAt: p.createdAt,
                          updatedAt: p.updatedAt,
                      }
                    : null;
                return { post: postOnce, articles };
            }

            return articles;
        } catch (error) {
            throw error;
        }
    }

    async addArticleToDonationFromPost(dtoAdd: AddArticleToDonationFromPost, userId: number, admin?: boolean): Promise<any> {
        try {
            if (!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('Usuario no identificado');
            }
            if (!dtoAdd || !dtoAdd.postArticleId || !dtoAdd.donationId) {
                throw new BadRequestException('Datos de entrada inválidos');
            }
            // Cargar artículo del post
            const postArticle = await this.postArticleService.getPostArticleById(dtoAdd.postArticleId);
            if (!postArticle) throw new BadRequestException('No existe el artículo del post indicado');

            // Donación con solo las relaciones necesarias (QueryBuilder)
            const donationRepo = this.postDonationArticleRepository.manager.getRepository(DonationEntity);
            const donation = await donationRepo.createQueryBuilder('d')
                .leftJoinAndSelect('d.user', 'donationUser')
                .leftJoinAndSelect('d.statusDonation', 'statusDonation')
                .leftJoinAndSelect('d.post', 'post')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .where('d.id = :donationId', { donationId: dtoAdd.donationId })
                .getOne();
            if (!donation) throw new BadRequestException('No existe la donación indicada');

            // Determinar dueño: si el post es solicitud de donación, el dueño es donation.user; si no, el dueño es post.user
            const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
            const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
            const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
            const currentId = userId;
            if (!admin && (!ownerUserId || Number(ownerUserId) !== Number(currentId))) {
                throw new BadRequestException('No tiene permisos para agregar artículos a esta donación');
            }

            const statusPending = await this.statusDonationService.findByname('pendiente');
            if (donation.statusDonation.id !== statusPending.id) {
                throw new BadRequestException('No se pueden agregar artículos a una donación que no está en estado pendiente');
            }

            const statusPostArticle = await this.statusPostArticleService.getStatusByName('disponible');
            if (postArticle.status.id !== statusPostArticle.id) {
                throw new BadRequestException('El artículo del post no está disponible');
            }
            const existArticleInDonation = await this.postDonationArticleRepository.findOne({
                where: {
                    donation: { id: donation.id },
                    postArticle: { id: postArticle.id }
                }
            }); 
            if (existArticleInDonation) {
                throw new BadRequestException('El artículo del post ya ha sido agregado a la donación');
            }
            const existQuantity = Number(postArticle.quantity);
            const requestedQuantity = Number(dtoAdd.quantity);
            if (existQuantity < requestedQuantity) {
                throw new BadRequestException('La cantidad solicitada excede la cantidad disponible en el artículo del post');
            }
            const newPostDonationArticle = this.postDonationArticleRepository.create({
                quantity: requestedQuantity.toString(),
                donation: donation,
                postArticle: postArticle,
            });
            const saved = await this.postDonationArticleRepository.save(newPostDonationArticle);
            
            // Return sanitized response without sensitive user data
            return {
                id: saved.id,
                quantity: saved.quantity,
                postArticleId: postArticle.id,
                article: {
                    id: postArticle.article.id,
                    name: postArticle.article.name,
                    descripcion: postArticle.article.descripcion,
                    createdAt: postArticle.article.createdAt,
                    updatedAt: postArticle.article.updatedAt,
                },
                status: {
                    id: postArticle.status.id,
                    status: postArticle.status.status,
                },
                donation: {
                    id: donation.id,
                    lugarRecogida: donation.lugarRecogida,
                    lugarDonacion: donation.lugarDonacion,
                    fechaMaximaEntrega: donation.fechaMaximaEntrega,
                    createdAt: donation.createdAt,
                    updatedAt: donation.updatedAt,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async addArticleToDonation(dtoAdd: AddArticleToDonationFromPost, admin?: boolean): Promise<any> {
        try {
            if (!dtoAdd || !dtoAdd.postArticleId || !dtoAdd.donationId) {
                throw new BadRequestException('Datos de entrada inválidos');
            }
            
            // Cargar artículo del post
            const postArticle = await this.postArticleService.getPostArticleById(dtoAdd.postArticleId);
            if (!postArticle) throw new BadRequestException('No existe el artículo del post indicado');

            // Donación con solo las relaciones necesarias (QueryBuilder)
            const donationRepo = this.postDonationArticleRepository.manager.getRepository(DonationEntity);
            const donation = await donationRepo.createQueryBuilder('d')
                .leftJoinAndSelect('d.statusDonation', 'statusDonation')
                .where('d.id = :donationId', { donationId: dtoAdd.donationId })
                .getOne();
            if (!donation) throw new BadRequestException('No existe la donación indicada');

            // Validar estado pendiente
            const statusPending = await this.statusDonationService.findByname('pendiente');
            if (donation.statusDonation.id !== statusPending.id) {
                throw new BadRequestException('No se pueden agregar artículos a una donación que no está en estado pendiente');
            }

            // Validar que el artículo esté disponible
            const statusPostArticle = await this.statusPostArticleService.getStatusByName('disponible');
            if (postArticle.status.id !== statusPostArticle.id) {
                throw new BadRequestException('El artículo del post no está disponible');
            }
            
            // Verificar si el artículo ya existe en la donación
            const existArticleInDonation = await this.postDonationArticleRepository.findOne({
                where: {
                    donation: { id: donation.id },
                    postArticle: { id: postArticle.id }
                }
            }); 
            if (existArticleInDonation) {
                throw new BadRequestException('El artículo del post ya ha sido agregado a la donación');
            }
            
            // Validar cantidad disponible
            const existQuantity = Number(postArticle.quantity);
            const requestedQuantity = Number(dtoAdd.quantity);
            if (existQuantity < requestedQuantity) {
                throw new BadRequestException('La cantidad solicitada excede la cantidad disponible en el artículo del post');
            }
            
            // Crear y guardar el artículo de donación
            const newPostDonationArticle = this.postDonationArticleRepository.create({
                quantity: requestedQuantity.toString(),
                donation: donation,
                postArticle: postArticle,
            });
            const saved = await this.postDonationArticleRepository.save(newPostDonationArticle);
            
            // Return sanitized response without sensitive user data
            return {
                id: saved.id,
                quantity: saved.quantity,
                postArticleId: postArticle.id,
                article: {
                    id: postArticle.article.id,
                    name: postArticle.article.name,
                    descripcion: postArticle.article.descripcion,
                    createdAt: postArticle.article.createdAt,
                    updatedAt: postArticle.article.updatedAt,
                },
                status: {
                    id: postArticle.status.id,
                    status: postArticle.status.status,
                },
                donation: {
                    id: donation.id,
                    lugarRecogida: donation.lugarRecogida,
                    lugarDonacion: donation.lugarDonacion,
                    fechaMaximaEntrega: donation.fechaMaximaEntrega,
                    createdAt: donation.createdAt,
                    updatedAt: donation.updatedAt,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async getPostDonationArticleById(id: number): Promise<PostArticleDonationEntity> {
        try {
            if(!id || id <=0 || isNaN(id) || id === undefined){
                throw new BadRequestException('ID de artículo de donación del post inválido');
            }
            const postDonationArticle = await this.postDonationArticleRepository.findOne({
                where: { id: id },
                relations: { donation: true, postArticle: true }
            });
            if(!postDonationArticle){
                throw new BadRequestException('No existe el artículo de donación del post indicado');
            }
            return postDonationArticle;
        } catch (error) {
            throw error;
        }   
     }

     async modifyQuantityInPostDonationArticle(dto:ModifyQuantityPostdonationarticleService, userId: number, admin?: boolean): Promise<PostArticleDonationEntity> {
        try {
            if (!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('Usuario no identificado');
            }
            if (!dto || !dto.postDonationArticleId || dto.newQuantity === undefined || dto.newQuantity === null || isNaN(dto.newQuantity) || dto.newQuantity < 0) {
                throw new BadRequestException('Datos de entrada inválidos');
            }
            const { postDonationArticleId, newQuantity } = dto;
            const postDonationArticle = await this.postDonationArticleRepository.findOne({
                where: {
                     id: postDonationArticleId 
                    },
                relations: {
                     donation: true, 
                     postArticle: true 
                    }
            });
            if (!postDonationArticle) {
                throw new BadRequestException('No existe el artículo de donación del post indicado');
            }
            const donationRepo = this.postDonationArticleRepository.manager.getRepository(DonationEntity);
            const donation = await donationRepo.createQueryBuilder('d')
                .leftJoinAndSelect('d.user', 'donationUser')
                .leftJoinAndSelect('d.statusDonation', 'statusDonation')
                .leftJoinAndSelect('d.post', 'post')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .where('d.id = :donationId', { donationId: postDonationArticle.donation.id })
                .getOne();
            if (!donation) throw new BadRequestException('No existe la donación indicada');

            const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
            const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
            const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
            if (!admin && (!ownerUserId || Number(ownerUserId) !== Number(userId))) {
                throw new BadRequestException('No tiene permisos para modificar la cantidad de este artículo en la donación');
            }
            
            // La nueva cantidad no puede exceder la cantidad disponible en el postArticle
            const availableInPost = Number(postDonationArticle.postArticle.quantity);
            if (newQuantity > availableInPost) {
                throw new BadRequestException(`La cantidad solicitada (${newQuantity}) excede la cantidad disponible en el artículo del post (${availableInPost})`);
            }
            
            postDonationArticle.quantity = newQuantity.toString();
            const saved = await this.postDonationArticleRepository.save(postDonationArticle);
            return saved;
        } catch (error) {
            throw error;
        }
    }

    async removeArticleFromDonationFromPost(postDonationArticleId: number, userId: number, admin?: boolean): Promise<{message:string, status:number}> {
        try {
            if (!userId || userId <= 0 || isNaN(userId) || userId === undefined) {
                throw new BadRequestException('Usuario no identificado');
            }
            const postDonationArticle = await this.postDonationArticleRepository.findOne({
                where: {
                     id: postDonationArticleId 
                    },
                relations: {
                     donation: true, 
                     postArticle: true 
                    }
            });
            if (!postDonationArticle) {
                throw new BadRequestException('No existe el artículo de donación del post indicado');
            }
            const donationRepo = this.postDonationArticleRepository.manager.getRepository(DonationEntity);
            const donation = await donationRepo.createQueryBuilder('d')
                .leftJoinAndSelect('d.user', 'donationUser')
                .leftJoinAndSelect('d.statusDonation', 'statusDonation')
                .leftJoinAndSelect('d.post', 'post')
                .leftJoinAndSelect('post.user', 'postUser')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .where('d.id = :donationId', { donationId: postDonationArticle.donation.id })
                .getOne();
            if (!donation) throw new BadRequestException('No existe la donación indicada');
            const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
            const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
            const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
            if (!admin && (!ownerUserId || Number(ownerUserId) !== Number(userId))) {
                throw new BadRequestException('No tiene permisos para eliminar artículos de esta donación');
            }
            const statusPending = await this.statusDonationService.findByname('pendiente');
            if (donation.statusDonation.id !== statusPending.id) {
                throw new BadRequestException('No se pueden eliminar artículos de una donación que no está en estado pendiente');
            }
            await this.postDonationArticleRepository.delete(postDonationArticleId);
            return {message: 'Artículo de donación del post eliminado correctamente', status: 200};
        } catch (error) {
            throw error;
        }
    }
}
