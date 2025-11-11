import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationEntity } from './entity/donation.entity';
import { Repository, Brackets } from 'typeorm';
import { StatusDonationEntity } from '../statusdonation/entity/status.donation.entity';
import { UserService } from '../user/user.service';
import { StatusdonationService } from '../statusdonation/statusdonation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { PostdonationarticleService } from '../postdonationarticle/postdonationarticle.service';
import { PostarticleService } from '../postarticle/postarticle.service';
import { PostService } from '../post/post.service';
import { StatusarticledonationService } from '../statusarticledonation/statusarticledonation.service';
import { UserarticleService } from '../userarticle/userarticle.service';
import { NotifyService } from '../notify/notify.service';
import { ConfigService } from '@nestjs/config';
import { URL_FRONTEND } from 'src/config/constants';
import { TypeNotifyService } from '../typenotify/typenotify.service';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepo: Repository<DonationEntity>,
    private readonly statusDonationService: StatusdonationService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => PostdonationarticleService))
    private readonly postDonationArticleService: PostdonationarticleService,
    private readonly postArticleService: PostarticleService,
    private readonly postService: PostService,
    private readonly statusArticleDonationService: StatusarticledonationService,
    private readonly userArticleService: UserarticleService,
    private readonly notifyService: NotifyService,
    private readonly configService: ConfigService,
    private readonly typeNotifyService: TypeNotifyService,
  ) { }

  async getDonationById(id: number, format: boolean = true): Promise<DonationEntity> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: {
          user: true,
          statusDonation: true,
          post: {
            user: true,
            typePost: true
          },
          postDonationArticlePost: {
            postArticle: {
              article: true
            },
          }
        },
      });
      if (!donation) throw new NotFoundException('Donación no encontrada');
      if (donation.user) {
        const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = donation.user as any;
        donation.user = userWithoutSensitive as any;
      }
      return format ? this.formatDonationResponse(donation) : donation;
    } catch (error) {
      throw error;
    }
  }

  private formatDonationResponse(donation: any, userId?: number): any {
    if (!donation) return donation;

    const formatted: any = {
      id: donation.id,
      lugarRecogida: donation.lugarRecogida ?? null,
      lugarDonacion: donation.lugarDonacion ?? null,
      comments: donation.comments ?? null,
      fechaMaximaEntrega: donation.fechaMaximaEntrega ?? null,
      post: donation.post ? { id: donation.post.id, title: donation.post.title, message: donation.post.message } : null,
      statusDonation: donation.statusDonation ? { id: donation.statusDonation.id, status: donation.statusDonation.status } : null,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
    };

    // Determinar si el tipo de post invierte roles (solicitud de donacion)
    const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
    const isSolicitudDonacion = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';

    const rawBeneficiaryUser = donation.user as any; // usuario directamente ligado a la donación
    const rawPostOwnerUser = donation.post?.user as any; // usuario que creó el post

    // Helper para formatear usuario
    const formatUser = (u: any) => {
      if (!u) return null;
      const { id, username, email, profilePhoto, emailVerified, verified, createdAt } = u;
      return { id, username, email, profilePhoto, emailVerified, verified, createdAt };
    };

    if (isSolicitudDonacion) {
      // En solicitudes de donación: donator = donation.user, beneficiary = post.user
      formatted.donator = formatUser(rawBeneficiaryUser);
      formatted.beneficiary = formatUser(rawPostOwnerUser);
    } else {
      // Caso normal: beneficiary = donation.user, donator = post.user
      formatted.beneficiary = formatUser(rawBeneficiaryUser);
      formatted.donator = formatUser(rawPostOwnerUser);
    }
    if (userId && donation.post.user) {
      const owner = donation.post?.user?.id === userId;
      (donation as any).owner = owner;
      formatted.owner = owner;
    }

    if (donation.postDonationArticlePost && Array.isArray(donation.postDonationArticlePost)) {
      formatted.articles = donation.postDonationArticlePost.map((pda: any) => ({
        id: pda.id,
        quantity: pda.quantity,
        postArticleId: pda.postArticle?.id ?? null,
        article: pda.postArticle && pda.postArticle.article ? {
          id: pda.postArticle.article.id,
          name: pda.postArticle.article.name,
          descripcion: pda.postArticle.article.descripcion,
        } : null,
      }));
    } else {
      formatted.articles = [];
    }

    return formatted;
  }

  async createDonation(createDonationDto: CreateDonationDto, currentUser: any): Promise<DonationEntity> {
    try {
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const { postId, lugarRecogida, articles } = createDonationDto || ({} as CreateDonationDto);
      if (!postId || isNaN(Number(postId)) || Number(postId) <= 0) {
        throw new BadRequestException('El postId es obligatorio y debe ser válido');
      }
      const fechaMaximaEntrega = createDonationDto.fechaMaximaEntrega ? new Date(createDonationDto.fechaMaximaEntrega) : null;
      if (!fechaMaximaEntrega || isNaN(fechaMaximaEntrega.getTime())) {
        throw new BadRequestException('La fecha máxima de entrega es obligatoria y debe ser válida');
      }
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaComparar = new Date(fechaMaximaEntrega);
      fechaComparar.setHours(0, 0, 0, 0);
      if (fechaComparar <= hoy) {
        throw new BadRequestException('La fecha máxima de entrega debe ser posterior al día de hoy');
      }
      if (!lugarRecogida || String(lugarRecogida).trim() === '') {
        throw new BadRequestException('El lugar de recogida es obligatorio');
      }
      const articlesArr: any[] = Array.isArray(articles as any) ? (articles as any) : [];
      if (articlesArr.length === 0) {
        throw new BadRequestException('Debe proporcionar al menos un artículo para la donación');
      }

      const currentUserId = currentUser.sub || currentUser.id || currentUser;
      const currentUserEntity = await this.userService.findById(currentUserId);
      if (!currentUserEntity) throw new NotFoundException('Usuario no encontrado');
      if (!currentUserEntity.verified) {
        throw new ForbiddenException('Solo usuarios verificados pueden crear donaciones');
      }

      const post = await this.postService.getPostById(Number(postId));
      if (!post) throw new NotFoundException('Post no encontrado');

      const typePostName = post.typePost?.type?.toLowerCase?.() || null;
      const isSolicitudDonacion = typePostName === 'solicitud de donacion' || 
                                  typePostName === 'solicitud_de_donacion' || 
                                  typePostName === 'solicitud-donacion';

      let receiver: any;
      if (isSolicitudDonacion) {
        receiver = post.user;
        if (currentUserEntity.id === post.user.id) {
          throw new ForbiddenException('No puedes donar a tu propia solicitud de donación');
        }
      } else {
        receiver = currentUserEntity;
        if (currentUserEntity.id === post.user.id) {
          throw new ForbiddenException('No puedes crear una donación para tu propio post');
        }
      }

      const receiverRol = (receiver as any).rol?.rol?.toLowerCase();
      if (receiverRol !== 'organizacion') {
        throw new ForbiddenException('Solo los usuarios con rol "organizacion" pueden recibir donaciones');
      }

      const statusPendiente = await this.statusDonationService.findByname('pendiente');

      const postArticles = await this.postArticleService.findByPost(Number(postId));

      const statusAvalaibleArticleDonation = await this.statusArticleDonationService.getStatusByName('disponible');

      const postArticleMap = new Map<number, { quantity: number; statusId: number; articleName: string }>();
      for (const pa of postArticles as any[]) {
        const paId = Number(pa.id);
        const paQty = Number(pa.quantity);
        const paStatusId: number = pa.status?.id ?? null;
        const articleName = pa.article?.name ?? 'Desconocido';

        postArticleMap.set(paId, { quantity: paQty, statusId: paStatusId, articleName });
      }

      const requestedByPostArticle = new Map<number, number>();
      for (const item of articlesArr) {
        const articlePostId = Number((item as any).articlePostId);
        const qty = Number((item as any).quantity);

        if (!articlePostId || isNaN(articlePostId) || articlePostId <= 0) {
          throw new BadRequestException('Cada artículo debe tener un articlePostId válido');
        }
        if (!qty || isNaN(qty) || qty <= 0) {
          throw new BadRequestException('Cada artículo debe tener una cantidad válida (> 0)');
        }

        if (!postArticleMap.has(articlePostId)) {
          throw new BadRequestException(`El artículo solicitado (${articlePostId}) no pertenece al post indicado`);
        }

        const articleData = postArticleMap.get(articlePostId)!;

        const newQuantity = Number(articleData.quantity) - qty;
        if (newQuantity < 0) {
          throw new BadRequestException(`La cantidad solicitada para el artículo del post (${articlePostId}) excede la disponible (${articleData.quantity})`);
        }

        if (!articleData.statusId || articleData.statusId !== statusAvalaibleArticleDonation.id) {
          throw new BadRequestException(
            `El artículo del post (${articlePostId}) no está disponible para donación. Artículo: ${articleData.articleName}`
          );
        }

        const current = requestedByPostArticle.get(articlePostId) || 0;
        requestedByPostArticle.set(articlePostId, current + qty);
      }

      for (const [paId, totalRequested] of requestedByPostArticle.entries()) {
        const availableData = postArticleMap.get(paId);
        if (!availableData) {
          throw new BadRequestException(`El artículo del post (${paId}) no fue encontrado`);
        }
        const available = availableData.quantity;
        if (totalRequested > available) {
          throw new BadRequestException(`La cantidad solicitada para el artículo del post (${paId}) excede la disponible (${available})`);
        }
      }
      const donationPayload: any = {
        lugarRecogida: createDonationDto.lugarRecogida,
        lugarDonacion: createDonationDto.lugarDonacion ?? null,
        comments: createDonationDto.comments ?? null,
        fechaMaximaEntrega,
        statusDonation: statusPendiente,
        user: receiver,
        post: { id: post.id },
      };

      const donation = this.donationRepo.create(donationPayload);
      const savedRaw = await this.donationRepo.save(donation);
      const savedDonation = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;
      if (!savedDonation) {
        throw new BadRequestException('No se pudo crear la donación');
      }

      for (const [postArticleId, totalQty] of requestedByPostArticle.entries()) {
        await this.postDonationArticleService.addArticleToDonation(
          { postArticleId, donationId: savedDonation.id, quantity: totalQty }
        );
      }

      const donationWithArticles = await this.donationRepo.findOne({
        where: { id: savedDonation.id },
        relations: {
          user: true,
          statusDonation: true,
          post: {
            user: true,
            typePost: true
          },
          postDonationArticlePost: {
            postArticle: {
              article: true
            }
          }
        }
      });

      if (!donationWithArticles) {
        throw new BadRequestException('No se pudo recuperar la donación creada');
      }

      // Sanitizar respuesta: formato limpio del usuario
      if (donationWithArticles.user) {
        const { id, username, email, profilePhoto, emailVerified, verified, createdAt } = donationWithArticles.user as any;
        (donationWithArticles as any).user = { id, username, email, profilePhoto, emailVerified, verified, createdAt };
      }

      // Formatear artículos para respuesta limpia
      if (donationWithArticles.postDonationArticlePost && donationWithArticles.postDonationArticlePost.length > 0) {
        (donationWithArticles as any).articles = donationWithArticles.postDonationArticlePost.map((pda: any) => ({
          id: pda.id,
          quantity: pda.quantity,
          article: pda.postArticle?.article ? {
            id: pda.postArticle.article.id,
            name: pda.postArticle.article.name,
            descripcion: pda.postArticle.article.descripcion,
          } : null,
        }));
        // Eliminar la relación compleja de la respuesta
        delete (donationWithArticles as any).postDonationArticlePost;
      }
      
      const urlFront = this.configService.get<string>(URL_FRONTEND);
      const notifyMessage = `Nueva donación creada para tu post "${post.title}". Revisa los detalles de la donación.`;
      const link = `${urlFront}/organization/donations/${savedDonation.id}`;
      
      const postOwnerUserId = post.user?.id;
      if (postOwnerUserId) {
        const typeNotifyDonation = await this.typeNotifyService.getByType('informaacion');
        const typeNotifyId = typeNotifyDonation?.id || 1;
        
        await this.notifyService.createNotify({
          title: 'Nueva Donación',
          message: notifyMessage,
          link: link,
          typeNotifyId: typeNotifyId,
          usersIds: [postOwnerUserId]
        });
      }

      return donationWithArticles;
    } catch (error) {
      throw error;
    }
  }

  async getUserDonations(userId: number, currentUser?: number): Promise<DonationEntity[]> {
    try {
      if (!userId) throw new BadRequestException('El id del usuario es obligatorio');

      const donations = await this.donationRepo.find({
        where: [
          { user: { id: userId } },
          { post: { user: { id: userId } } }
        ],
        relations: {
          user: true,
          statusDonation: true,
          post: {
            user: true,
            typePost: true
          },
          postDonationArticlePost: {
            postArticle: {
              article: true
            }
          }
        }
      });
      const formatedDonations = donations.map(donation => this.formatDonationResponse(donation, userId));

      return formatedDonations;
    } catch (error) {
      throw error;
    }
  }

  async getDonationsByUser(idUser: number, currentUser?: number, options?: any): Promise<any[]> {
    try {
      if (!idUser) throw new BadRequestException('El id del usuario es obligatorio');

      const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
      let offset = Number(options?.offset) || 0;
      if (options?.page && Number(options.page) > 0) {
        offset = (Number(options.page) - 1) * limit;
      }

      const cursor = options?.cursor ? new Date(String(options.cursor)) : null;
      const role = options?.role ? String(options.role).toLowerCase() : null; // donador | beneficiario

      const qb = this.donationRepo.createQueryBuilder('donation')
        .leftJoinAndSelect('donation.post', 'post')
        .leftJoinAndSelect('post.typePost', 'typePost')
        .leftJoinAndSelect('post.user', 'postUser')
        .leftJoinAndSelect('donation.user', 'donationUser')
        .leftJoinAndSelect('donation.statusDonation', 'statusDonation')
        .leftJoinAndSelect('donation.postDonationArticlePost', 'pda')
        .leftJoinAndSelect('pda.postArticle', 'postArticle')
        .leftJoinAndSelect('postArticle.article', 'article');

      const solicitud = 'solicitud de donacion';

      if (role === 'donador') {
        // donator: if type is solicitud -> donation.user; else -> post.user
        qb.where(new Brackets(b => {
          b.where('LOWER(typePost.type) = :sol AND donation.userId = :userId', { sol: solicitud, userId: idUser })
           .orWhere('LOWER(typePost.type) != :sol AND post.userId = :userId', { sol: solicitud, userId: idUser });
        }));
      } else if (role === 'beneficiario') {
        // beneficiary: if type is solicitud -> post.user; else -> donation.user
        qb.where(new Brackets(b => {
          b.where('LOWER(typePost.type) = :sol AND post.userId = :userId', { sol: solicitud, userId: idUser })
           .orWhere('LOWER(typePost.type) != :sol AND donation.userId = :userId', { sol: solicitud, userId: idUser });
        }));
      } else {
        // default: any donation related to user (either donation.user or post.user)
        qb.where(new Brackets(b => {
          b.where('donation.userId = :userId', { userId: idUser })
           .orWhere('post.userId = :userId', { userId: idUser });
        }));
      }

      // status filter
      if (options?.statusId) {
        qb.andWhere('statusDonation.id = :statusId', { statusId: Number(options.statusId) });
      }

      // date filters
      if (options?.startDate) {
        qb.andWhere('donation.createdAt >= :startDate', { startDate: new Date(options.startDate) });
      }
      if (options?.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        qb.andWhere('donation.createdAt <= :endDate', { endDate: end });
      }

      // search filters (lugar, articulos.content) - similar behaviour to getDonationHistory
      if (options?.searchParam && options?.typeSearch && Array.isArray(options.typeSearch) && options.typeSearch.length > 0) {
        const searchTerm = `%${options.searchParam}%`;
        const conditions: string[] = [];
        for (const field of options.typeSearch) {
          if (field === 'lugar') {
            conditions.push('(donation.lugarRecogida ILIKE :searchTerm OR donation.lugarDonacion ILIKE :searchTerm)');
          } else if (field === 'articulos.content') {
            // search by article name or description
            conditions.push('(article.name ILIKE :searchTerm OR article.descripcion ILIKE :searchTerm)');
          }
        }
        if (conditions.length > 0) {
          qb.andWhere(`(${conditions.join(' OR ')})`).setParameter('searchTerm', searchTerm);
        }
      }

      // cursor (infinite scroll)
      if (cursor && !isNaN(cursor.getTime())) {
        qb.andWhere('donation.createdAt < :cursor', { cursor: cursor.toISOString() });
      }

      // ordering
      const orderField = options?.orderBy === 'updatedAt' ? 'donation.updatedAt' : 'donation.createdAt';
      qb.orderBy(orderField, 'DESC')
        .skip(offset)
        .take(limit);

      const donations = await qb.getMany();
      return donations.map(d => this.formatDonationResponse(d, currentUser));
    } catch (error) {
      throw error;
    }
  }

  async getDonationsMadeByUser(userId: number, options?: { limit?: number; offset?: number; page?: number; }): Promise<any[]> {
    try {
      if (!userId) throw new BadRequestException('El id del usuario es obligatorio');

      const limit = Math.min(Math.max(Number(options?.limit) || 20, 1), 100);
      let offset = Number(options?.offset) || 0;
      if (options?.page && Number(options.page) > 0) {
        offset = (Number(options.page) - 1) * limit;
      }

      const qb = this.donationRepo.createQueryBuilder('donation')
        .leftJoinAndSelect('donation.post', 'post')
        .leftJoinAndSelect('post.typePost', 'typePost')
        .leftJoinAndSelect('post.user', 'postUser')
        .leftJoinAndSelect('donation.user', 'donationUser')
        .leftJoinAndSelect('donation.statusDonation', 'statusDonation')
        .leftJoinAndSelect('donation.postDonationArticlePost', 'pda')
        .leftJoinAndSelect('pda.postArticle', 'postArticle')
        .leftJoinAndSelect('postArticle.article', 'article')
        .where(new Brackets(qbWhere => {
          qbWhere.where("LOWER(typePost.type) = :solicitud AND donation.userId = :userId", { solicitud: 'solicitud de donacion', userId })
            .orWhere("LOWER(typePost.type) != :solicitud AND post.userId = :userId", { solicitud: 'solicitud de donacion', userId });
        }))
        .orderBy('donation.createdAt', 'DESC')
        .skip(offset)
        .take(limit);

      const donations = await qb.getMany();
      return donations.map(d => this.formatDonationResponse(d, userId));
    } catch (error) {
      throw error;
    }
  }

  async updateDonation(id: number, updateDonationDto: UpdateDonationDto, currentUser?: any, admin?: boolean): Promise<DonationEntity> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: {
          user: true,
          statusDonation: true,
          post: {
            user: true,
            typePost: true,
          },
          postDonationArticlePost: {
            postArticle: {
              article: true
            }
          }
        },
      });
      if (!donation) throw new NotFoundException('Donación no encontrada');

      // Permisos: dueño depende del tipo de publicación
      if (currentUser && !admin) {
        const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
        const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
        const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
        const currentId = currentUser?.id ?? currentUser?.sub ?? currentUser;
        const isOwner = ownerUserId && currentId && Number(ownerUserId) === Number(currentId);
        if (!isOwner) {
          throw new ForbiddenException('No tienes permiso para actualizar esta donación');
        }
      }

      const statusPendiente = await this.statusDonationService.findByname('pendiente');
      if (donation.statusDonation && statusPendiente && donation.statusDonation.id !== statusPendiente.id) {
        throw new ForbiddenException('Solo se pueden actualizar donaciones con estado pendiente');
      }

      // Actualizar campos
      Object.assign(donation, updateDonationDto);
      const updated = await this.donationRepo.save(donation);

      // Remover campos sensibles
      const formatted = this.formatDonationResponse(updated, currentUser.id);

      return formatted;
    } catch (error) {
      throw error;
    }
  }

  async deleteDonation(id: number, currentUser: any): Promise<{ message: string, status: number }> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: {
          user: true,
          statusDonation: true,
          post: { user: true, typePost: true },
        },
      });

      if (!donation) throw new NotFoundException('Donación no encontrada');

      const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
      const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
      const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
      const currentId = currentUser?.id ?? currentUser?.sub ?? currentUser;
      const isOwner = ownerUserId && currentId && Number(ownerUserId) === Number(currentId);

      if (!isOwner) {
        throw new ForbiddenException('No tienes permiso para eliminar esta donación');
      }

      // Validar estado: solo si es propietario
      if (isOwner) {
        const pendingStatus = await this.statusDonationService.findByname('pendiente')

        if (donation.statusDonation && pendingStatus && donation.statusDonation.id !== pendingStatus.id) {
          throw new ForbiddenException('No se puede eliminar una donación con estado diferente a pendiente');
        }
      }

      await this.donationRepo.delete(id);
      return { message: 'Donación eliminada correctamente', status: 200 };
    } catch (error) {
      throw error;
    }
  }

  async deleteAdminDonation(id: number): Promise<{ message: string, status: number }> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');

      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: {
          statusDonation: true
        }
      });
      if (!donation) throw new NotFoundException('Donación no encontrada');

      const statusPendiente = await this.statusDonationService.findByname('pendiente');
      if (donation.statusDonation && statusPendiente && donation.statusDonation.id !== statusPendiente.id) {
        throw new ForbiddenException('Solo se pueden eliminar donaciones con estado pendiente');
      }

      await this.donationRepo.delete(id);
      return { message: 'Donación eliminada correctamente por admin', status: 200 };
    } catch (error) {
      throw error;
    }
  }

  async changeStatus(donationId: number, newStatus: number, currentUser?: any, admin?: boolean): Promise<DonationEntity> {
    try {
      if (!donationId) throw new BadRequestException('El id de la donación es obligatorio');
      if (!newStatus) throw new BadRequestException('El estado es obligatorio');

      const donation = await this.donationRepo.createQueryBuilder('d')
        .leftJoinAndSelect('d.user', 'donationUser')
        .leftJoinAndSelect('d.statusDonation', 'statusDonation')
        .leftJoinAndSelect('d.post', 'post')
        .leftJoinAndSelect('post.user', 'postUser')
        .leftJoinAndSelect('post.typePost', 'typePost')
        .leftJoinAndSelect('d.postDonationArticlePost', 'pda')
        .leftJoinAndSelect('pda.postArticle', 'postArticle')
        .leftJoinAndSelect('postArticle.article', 'article')
        .where('d.id = :donationId', { donationId })
        .getOne();
      
      if (!donation) throw new NotFoundException('Donación no encontrada');

      const statusEntity = await this.statusDonationService.findById(newStatus);
      if (!statusEntity) throw new NotFoundException('Estado no encontrado en la base de datos');

      if (currentUser && !admin) {
        const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
        const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
        const ownerUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
        const currentId = currentUser?.id ?? currentUser?.sub ?? currentUser;
        const isOwner = ownerUserId && currentId && Number(ownerUserId) === Number(currentId);
        if (!isOwner) throw new ForbiddenException('No tienes permiso para cambiar el estado');
      }

      const statusDeclined = await this.statusDonationService.findByname('rechazada');
      const statusPending = await this.statusDonationService.findByname('pendiente');
      const statusCanceled = await this.statusDonationService.findByname('cancelada');

      if (donation.statusDonation.id === statusDeclined.id || donation.statusDonation.id === statusCanceled.id) {
        throw new BadRequestException('No se puede cambiar el estado de una donación que ya ha sido rechazada o cancelada.');
      }

      if (donation.statusDonation.id === statusPending.id && statusEntity.id === statusPending.id) {
        throw new BadRequestException('La donación ya se encuentra en estado pendiente.');
      }

      if (donation.statusDonation.id !== statusPending.id && statusEntity.id === statusPending.id) {
        throw new BadRequestException('No se puede cambiar una donación de vuelta a estado pendiente.');
      }

      if (donation.statusDonation.id === statusPending.id &&
          (statusEntity.id === statusDeclined.id || statusEntity.id === statusCanceled.id)) {
        for (const pda of donation.postDonationArticlePost as any[]) {
          const postArticleId = pda.postArticle?.id;
          if (!postArticleId) continue;

          const cantidadActual = Number(pda.postArticle.quantity);
          const cantidadDonada = Number(pda.quantity);
          const nuevaCantidad = cantidadActual + cantidadDonada;

          await this.postArticleService.asignNewQuantity(postArticleId, nuevaCantidad);

          if (nuevaCantidad > 0) {
            const postArticleRepo = this.donationRepo.manager.getRepository('PostArticleEntity');
            const currentArticle = await postArticleRepo.findOne({ 
              where: { id: postArticleId },
              relations: ['status'] 
            });
            
            if (currentArticle) {
              const statusAvailable = await this.statusArticleDonationService.getStatusByName('disponible');
              const statusUnavailable = await this.statusArticleDonationService.getStatusByName('no disponible');
              
              if (currentArticle.status?.id === statusUnavailable.id) {
                currentArticle.status = statusAvailable;
                await postArticleRepo.save(currentArticle);
              }
            }
          }
        }
      }

      const statusCompleted = await this.statusDonationService.findByname('completada');
      const statusDelivered = await this.statusDonationService.findByname('entregada');
      
      if (donation.statusDonation.id === statusPending.id &&
          (statusEntity.id === statusCompleted?.id || statusEntity.id === statusDelivered?.id)) {
        
        const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
        const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
        const beneficiaryUserId = isSolicitud ? donation.post?.user?.id : donation.user?.id;
        
        if (beneficiaryUserId) {
          const donationWithArticles = await this.donationRepo.createQueryBuilder('d')
            .leftJoinAndSelect('d.postDonationArticlePost', 'pda')
            .leftJoinAndSelect('pda.postArticle', 'pa')
            .leftJoinAndSelect('pa.article', 'article')
            .where('d.id = :donationId', { donationId })
            .getOne();

          if (donationWithArticles?.postDonationArticlePost) {
            for (const pda of donationWithArticles.postDonationArticlePost as any[]) {
              const articleId = pda.postArticle?.article?.id;
              const quantity = Number(pda.quantity);
              
              if (articleId && quantity > 0) {
                await this.userArticleService.addArticleToUser({
                  user: beneficiaryUserId,
                  article: articleId,
                  cant: quantity,
                  needed: false
                });
              }
            }
          }
        }
      }

      donation.statusDonation = statusEntity;
      const updated = await this.donationRepo.save(donation);

      const urlFront = this.configService.get<string>(URL_FRONTEND);
      const link = `${urlFront}/organization/donations/${donationId}`;
      
      const typePostName = donation.post?.typePost?.type?.toLowerCase?.() || null;
      const isSolicitud = typePostName === 'solicitud de donacion' || typePostName === 'solicitud_de_donacion' || typePostName === 'solicitud-donacion';
      const receiverUserId = isSolicitud ? donation.post?.user?.id : donation.user?.id;
      const donorUserId = isSolicitud ? donation.user?.id : donation.post?.user?.id;
      
      const typeNotifyDonation = await this.typeNotifyService.getByType('informaacion');
      const typeNotifyId = typeNotifyDonation?.id || 1;
      
      if (statusEntity.id === statusDeclined?.id && receiverUserId) {
        await this.notifyService.createNotify({
          title: 'Donación Rechazada',
          message: `Tu donación ha sido rechazada.`,
          link: link,
          typeNotifyId: typeNotifyId,
          usersIds: [receiverUserId]
        });
      }else
      
      if (statusEntity.id === statusCanceled?.id && donorUserId) {
        await this.notifyService.createNotify({
          title: 'Donación Cancelada',
          message: `La donación ha sido cancelada.`,
          link: link,
          typeNotifyId: typeNotifyId,
          usersIds: [donorUserId]
        });
      }else
      
      if (statusEntity.id === statusCompleted?.id || statusEntity.id === statusDelivered?.id) {
        const notifyUserIds: number[] = [];
        if (receiverUserId) notifyUserIds.push(receiverUserId);
        if (donorUserId) notifyUserIds.push(donorUserId);
        
        if (notifyUserIds.length > 0) {
          await this.notifyService.createNotify({
            title: statusEntity.id === statusCompleted?.id ? 'Donación Completada' : 'Donación Entregada',
            message: `La donación ha sido ${statusEntity.id === statusCompleted?.id ? 'completada' : 'entregada'}.`,
            link: link,
            typeNotifyId: typeNotifyId,
            usersIds: notifyUserIds
          });
        }
      }else{
        // Otros estados: notificar al receptor
        if (receiverUserId) {
          await this.notifyService.createNotify({
            title: 'Actualización de Donación',
            message: `El estado de tu donación ha sido actualizado a "${statusEntity.status}".`,
            link: link,
            typeNotifyId: typeNotifyId,
            usersIds: [receiverUserId]
          });
        }
      }

      const formatted = this.formatDonationResponse(updated, currentUser.id);
      return formatted;
    } catch (error) {
      throw error;
    }
  }

  async getDonationHistory(currentUser: any, filters: any): Promise<DonationEntity[]> {
    try {
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const userId = filters.userId ? filters.userId : currentUser.id;

      let query = this.donationRepo.createQueryBuilder('d')
        .leftJoinAndSelect('d.user', 'user')
        .leftJoinAndSelect('d.statusDonation', 'statusDonation')
        .leftJoinAndSelect('d.post', 'post')
        .leftJoinAndSelect('post.user', 'postUser')
        .leftJoinAndSelect('post.typePost', 'typePost')
        .leftJoinAndSelect('d.postDonationArticlePost', 'postDonationArticlePost')
        .leftJoinAndSelect('postDonationArticlePost.postArticle', 'postArticle')
        .leftJoinAndSelect('postArticle.article', 'article');

      // Filtro por usuario
      query = query.where('d.userId = :userId', { userId });

      // Filtro por rango de fechas
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          query = query.andWhere('d.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          query = query.andWhere('d.createdAt <= :endDate', { endDate });
        }
      }

      // Filtro de búsqueda por campos específicos
      if (filters.searchParam && filters.typeSearch && filters.typeSearch.length > 0) {
        const searchTerm = `%${filters.searchParam}%`;
        const conditions: string[] = [];

        for (const field of filters.typeSearch) {
          if (field === 'lugar') {
            conditions.push(`(d.lugarRecogida ILIKE :searchTerm OR d.lugarDonacion ILIKE :searchTerm)`);
          } else if (field === 'articulos.content') {
            conditions.push(`(d.articles::text ILIKE :searchTerm)`);
          }
        }

        if (conditions.length > 0) {
          query = query.andWhere(`(${conditions.join(' OR ')})`);
          query = query.setParameter('searchTerm', searchTerm);
        }
      }

      // Ordenamiento
      if (filters.orderBy) {
        const orderField = filters.orderBy === 'createdAt' || filters.orderBy === 'updatedAt'
          ? `d.${filters.orderBy}`
          : 'd.createdAt';
        query = query.orderBy(orderField, 'DESC');
      } else {
        query = query.orderBy('d.createdAt', 'DESC');
      }

      const donations = await query.getMany();

      // Formatear todas las donaciones usando la función reutilizable
      const formatted = donations.map(donation => this.formatDonationResponse(donation, currentUser.id));
      return formatted;
    } catch (error) {
      throw error;
    }
  }

  async incrementDonationDate(id: number, currentUser: number, admin?: boolean): Promise<DonationEntity> {
    try {
      if (!id || id <= 0 || isNaN(id) || id === undefined) throw new BadRequestException('El id de la donación es obligatorio y debe ser válido');
      if (!currentUser || currentUser <= 0 || isNaN(currentUser) || currentUser === undefined) throw new ForbiddenException('Usuario no autenticado');
      const donation = await this.donationRepo.createQueryBuilder('donation')
        .leftJoinAndSelect('donation.user', 'donationUser')
        .leftJoinAndSelect('donation.post', 'post')
        .leftJoinAndSelect('post.user', 'postUser')
        .leftJoinAndSelect('post.typePost', 'postTypePost')
        .where('donation.id=:id', { id })
        .getOne();
      if (!donation) throw new NotFoundException('Donación no encontrada');

      if ((donation as any).incrementDate) throw new BadRequestException('La donación no se puede extender más de una vez');

      let userOwner: any = donation.post?.user ?? null;
      const typePost = donation.post?.typePost?.type?.toLowerCase?.();
      if (typePost && (typePost === 'solicitud de donacion' || typePost === 'solicitud_de_donacion' || typePost === 'solicitud-donacion')) {
        userOwner = (donation as any).user ?? userOwner;
      }

      if (currentUser && !admin) {
        const isOwner = userOwner && userOwner.id === currentUser;
        if (!isOwner) throw new ForbiddenException('No tienes permiso para actualizar esta donación');
      }

      const baseDate = donation.fechaMaximaEntrega ? new Date(donation.fechaMaximaEntrega) : new Date();
      baseDate.setDate(baseDate.getDate() + 10);
      donation.fechaMaximaEntrega = baseDate;
      (donation as any).incrementDate = true;
      const updatedDonation = await this.donationRepo.save(donation);
      const formatted = this.formatDonationResponse(updatedDonation, currentUser);
      return formatted;

    } catch (error) {
      throw error;
    }
  }
}
