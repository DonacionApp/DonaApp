import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException, HttpException, ForbiddenException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { Repository } from 'typeorm';
import { ImagepostService } from '../imagepost/imagepost.service';
import { TagsService } from '../tags/tags.service';
import { PosttagsService } from '../posttags/posttags.service';
import { isArray } from 'class-validator';
import { TypepostService } from '../typepost/typepost.service';
import { PostFilterDto } from './dto/filter.dto';
import { PostlikedService } from '../postLiked/postliked.service';
import { ArticleService } from '../article/article.service';
import { PostarticleService } from '../postarticle/postarticle.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>,
        @Inject(forwardRef(() => ImagepostService))
        private readonly imagePostService: ImagepostService,
        private readonly tagsService: TagsService,
        @Inject(forwardRef(() => PosttagsService))
        private readonly postTagsService: PosttagsService,
        @Inject(forwardRef(() => TypepostService))
        private readonly typePostService: TypepostService,
        @Inject(forwardRef(() => PostlikedService))
        private readonly postLikedService: PostlikedService,
        private articleService:ArticleService,
        @Inject(forwardRef(() => PostarticleService))
        private readonly postArticleService: PostarticleService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => AuditService))
        private readonly auditService: AuditService,
    ) { }

    async userLikedPost(userId: number, postId: number): Promise<boolean> {
        try {
            if (!userId || userId <= 0 || userId === undefined || userId === null || isNaN(userId)) {
                throw new BadRequestException('no se ha recibido correctamente el usuario');
            }
            if (!postId || postId <= 0 || postId === undefined || postId === null || isNaN(postId)) {
                throw new BadRequestException('no se ha recibido correctamente el post');
            }
            userId = Number(userId);
            postId = Number(postId);
            const liked = await this.postLikedService.userLikedPost(userId, postId);
            return liked;
        } catch (error) {
            throw error;
        }
    }

    async getPostById(id: number, userId?: number): Promise<PostEntity> {
        try {
            if (id <= 0 || id === undefined || id === null || isNaN(id) || !id) {
                throw new Error('El id del post es invalido');
            }

            const qb = this.postRepository
                .createQueryBuilder('post')
                .leftJoinAndSelect('post.imagePost', 'imagePost')
                .leftJoinAndSelect('post.tags', 'postTags')
                .leftJoinAndSelect('postTags.tag', 'tag')
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.people', 'people')
                .leftJoinAndSelect('user.rol', 'userRol')
                .leftJoinAndSelect('post.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.article', 'article')
                .leftJoinAndSelect('postArticle.status', 'status')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .where('post.id = :id', { id })
                // contar likes sin traer la relación completa
                .loadRelationCountAndMap('post.likesCount', 'post.postLiked');

            const numericUserId = Number(userId);
            if (numericUserId && numericUserId > 0) {
                // contar si el usuario ha dado like (0/1)
                qb.loadRelationCountAndMap(
                    'post._userHasLikedCount',
                    'post.postLiked',
                    'liked',
                    (subQb) => subQb.andWhere('liked.user.id = :userId', { userId: numericUserId }),
                );
            }

            let post = await qb.getOne();

            if (!post) {
                throw new NotFoundException('post no encontrado');
            }

            if (post.user) {
                const roleName = (post.user as any).rol?.rol;
                const people = (post.user as any).people;
                const residencia = people?.residencia ?? null;
                let municipio: any = null;
                if (people?.municipio) {
                    try {
                        const { countryExist, stateExist, citiExist } = await this.userService.normalizeMunicipio(people.municipio as any);
                        municipio = { country: countryExist, state: stateExist, city: citiExist };
                    } catch (_) {}
                }
                const { id: uid, username, profilePhoto, emailVerified, verified, createdAt } = post.user as any;
                post.user = { id: uid, username, profilePhoto, emailVerified, verified, createdAt, rol: roleName, residencia, municipio } as any;
            }

            // mapear userHasLiked a booleano y limpiar propiedad interna
            const internalCount = (post as any)._userHasLikedCount;
            if (internalCount !== undefined) {
                (post as any).userHasLiked = Number(internalCount) > 0;
                delete (post as any)._userHasLikedCount;
            } else if (numericUserId && numericUserId > 0) {
                // Fallback seguro en caso de que no se haya mapeado (no carga toda la relación)
                const liked = await this.postRepository
                    .createQueryBuilder('p')
                    .innerJoin('p.postLiked', 'liked')
                    .where('p.id = :pid', { pid: id })
                    .andWhere('liked.user.id = :userId', { userId: numericUserId })
                    .getCount();
                (post as any).userHasLiked = liked > 0;
            }

            return post;
        } catch (error) {
            throw error;
        }
    }

    async createPost(data: any, files?: Express.Multer.File | Express.Multer.File[]): Promise<PostEntity> {
        const action = 'post.create';
        const userId = data?.userId || data?.user?.id;
        const payload = { data, filesMeta: Array.isArray(files) ? files.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })) : undefined };
        try {
            if (!data) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Data es requerida para crear el post', payload }), 400, payload);
                throw new Error('Data es requerida para crear el post');
            }
            const { tags, typePost, user, articles, postArticles, ...rest } = data;
            if (!rest.title || !rest.message) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'title y message son obligatorios', payload }), 400, payload);
                throw new Error('title y message son obligatorios');
            }
            if (data?.typePost && data?.typePost <= 0) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'El tipo de post es invalido', payload }), 400, payload);
                throw new BadRequestException('El tipo de post es invalido');
            }
            const typePostNormali = typePost ? (typeof typePost === 'number' ? { id: typePost } : (typePost.id ? { id: typePost.id } : (!isNaN(Number(typePost)) ? { id: Number(typePost) } : undefined))) : undefined;
            if (!typePostNormali) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'El tipo de post es invalido', payload }), 400, payload);
                throw new BadRequestException('El tipo de post es invalido');
            }
            const existTypePost = await this.typePostService.findById(typePostNormali.id);
            if (!existTypePost) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'El tipo de post no existe', payload }), 404, payload);
                throw new NotFoundException('El tipo de post no existe');
            }
            if (existTypePost && existTypePost.type && existTypePost.type.toLowerCase() === 'solicitud de donacion') {
                const userIdToCheck = (user && user.id) ? user.id : userId;
                if (!userIdToCheck) {
                    await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'No se puede identificar el usuario', payload }), 400, payload);
                    throw new BadRequestException('No se puede identificar el usuario');
                }
                const userEntity = await this.userService.findById(userIdToCheck);
                if (!userEntity) {
                    await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Usuario no encontrado', payload }), 404, payload);
                    throw new NotFoundException('Usuario no encontrado');
                }
                const userRol = (userEntity as any).rol?.rol?.toLowerCase();
                if (userRol !== 'organizacion') {
                    await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Solo los usuarios con rol "organizacion" pueden crear publicaciones de tipo "solicitud de donacion"', payload }), 403, payload);
                    throw new ForbiddenException('Solo los usuarios con rol "organizacion" pueden crear publicaciones de tipo "solicitud de donacion"');
                }
            }
            const postPayload: any = {
                title: rest.title,
                message: rest.message,
                user: user && user.id ? { id: user.id } : (userId ? { id: userId } : undefined),
                typePost: existTypePost,
            };
            if (files && Array.isArray(files) && files.length > 0) {
                let largeFilesError: any[] = [];
                await Promise.all(files.map(async (file) => {
                    const fileSizeValidation = await this.imagePostService.verifyFileSize(file);
                    if ((fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 413) || (fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 415)) {
                        largeFilesError.push(fileSizeValidation);
                    }
                }));
                if (largeFilesError.length > 0) {
                    const errorMessages = largeFilesError.map(err => err.message).join('; ');
                    await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: `Algunos archivos son demasiado grandes: ${errorMessages}`, payload }), 413, payload);
                    throw new HttpException({ message: `Algunos archivos son demasiado grandes: ${errorMessages}`, details: largeFilesError }, 413);
                }
            } else if (files && !Array.isArray(files)) {
                const fileSizeValidation = await this.imagePostService.verifyFileSize(files);
                if ((fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 413) || (fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 415)) {
                    await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: `El archivo es demasiado grande`, payload }), 413, payload);
                    throw new HttpException({ message: `El archivo es demasiado grande`, details: [fileSizeValidation] }, 413);
                }
            }
            if (!postPayload.user) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'User (userId o user.id) es requerido para crear post', payload }), 400, payload);
                throw new Error('User (userId o user.id) es requerido para crear post');
            }
            const newPost = this.postRepository.create(postPayload);
            const savedPost = await this.postRepository.save(newPost);
            const postId = (savedPost as any).id;
            if (tags) {
                let tagsArr: any[] = [];
                if (Array.isArray(tags)) tagsArr = tags;
                else if (typeof tags === 'string') tagsArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
                for (const t of tagsArr) {
                    try {
                        if (!t) continue;
                        if (!isNaN(Number(t))) {
                            const tagId = Number(t);
                            await this.postTagsService.createPostTag(postId, tagId);
                        } else {
                            let tagEntity;
                            try {
                                tagEntity = await this.tagsService.getTabByName(t);
                            } catch (err) {
                                tagEntity = await this.tagsService.createTag(t);
                            }
                            if (tagEntity && tagEntity.id) {
                                await this.postTagsService.createPostTag(postId, tagEntity.id);
                            }
                        }
                    } catch (err) {
                        const msg = (err && err.message) ? err.message : '';
                        if (!msg.includes('la relacion post-tag ya existe')) {
                            throw err;
                        }
                    }
                }
            }
            const rawArticlesInput = (articles ?? postArticles);
            if (rawArticlesInput) {
                let items: any[] = [];
                if (Array.isArray(rawArticlesInput)) {
                    items = rawArticlesInput;
                } else if (typeof rawArticlesInput === 'string') {
                    try {
                        const parsed = JSON.parse(rawArticlesInput);
                        if (Array.isArray(parsed)) items = parsed;
                    } catch (_) {}
                }
                if (items.length > 0) {
                    const ownerUserId = (user && user.id) ? Number(user.id) : (userId ? Number(userId) : undefined);
                    for (const item of items) {
                        try {
                            if (!item) continue;
                            const qty = (item.quantiy ?? item.quantity ?? 1);
                            const quantity = String(isNaN(Number(qty)) ? 1 : Number(qty));
                            if (item.idArticle && !isNaN(Number(item.idArticle)) && Number(item.idArticle) > 0) {
                                const dto = { post: Number(postId), article: Number(item.idArticle), quantity } as any;
                                await this.postArticleService.addPostArticle(dto, Number(ownerUserId));
                                continue;
                            }
                            if (item.name && typeof item.name === 'string') {
                                const name = String(item.name).trim().toLowerCase();
                                const description = (typeof item.description === 'string' ? item.description.trim() : undefined);
                                let articleId: number | undefined;
                                try {
                                    const exist = await this.articleService.getArticleByName(name);
                                    articleId = exist?.id;
                                } catch (err) {
                                    const created = await this.articleService.createArticle({ name, description });
                                    articleId = created?.id;
                                }
                                if (articleId && articleId > 0) {
                                    const dto = { post: Number(postId), article: Number(articleId), quantity } as any;
                                    await this.postArticleService.addPostArticle(dto, Number(ownerUserId));
                                }
                            }
                        } catch (err) {
                            throw err;
                        }
                    }
                }
            }
            if (files && Array.isArray(files) && files.length > 0) {
                for (const file of files) {
                    await this.imagePostService.addImageToPost(postId, file);
                }
            }
            const result = await this.getPostById(postId);
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Post creado', payload, response: result }), 201, payload);
            return result;
        } catch (error) {
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: error?.message || 'Error al crear post', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }

    async findAll(userId?: number, limit: number = 20, cursor?: number): Promise<PostEntity[]> {
        try {
            const query = this.postRepository.createQueryBuilder('post')
                .leftJoinAndSelect('post.imagePost', 'imagePost')
                .leftJoinAndSelect('post.tags', 'postTags')
                .leftJoinAndSelect('postTags.tag', 'tag')
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.people', 'people')
                .leftJoinAndSelect('user.rol', 'userRol')
                .leftJoinAndSelect('post.postLiked', 'postLiked')
                .leftJoinAndSelect('post.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.article', 'article')
                .leftJoinAndSelect('postArticle.status', 'status')
                .leftJoinAndSelect('post.typePost', 'typePost');

            if (cursor && cursor > 0) {
                query.andWhere('post.id < :cursor', { cursor });
            }

            query
                .orderBy('post.id', 'DESC')
                .take(limit);

            const posts = await query.getMany();

            if (!posts || posts.length === 0) {
                throw new NotFoundException('No se encontraron posts');
            }

            userId = Number(userId);

            let userLikedPostIds: Set<number> = new Set();
            if (userId && userId > 0) {
                const postIds = posts.map(post => post.id);
                const userLikes = await this.postRepository
                    .createQueryBuilder('post')
                    .innerJoin('post.postLiked', 'liked')
                    .where('post.id IN (:...postIds)', { postIds })
                    .andWhere('liked.user.id = :userId', { userId })
                    .select('post.id')
                    .getMany();
                
                userLikedPostIds = new Set(userLikes.map(post => post.id));
            }

            const postsWithUserInfo = posts.map(post => {
                // replaced below with async normalization logic; placeholder
                return post;
            });

            const enrichedPosts = await Promise.all(postsWithUserInfo.map(async post => {
                if (post.user) {
                    const roleName = (post.user as any).rol?.rol;
                    const people = (post.user as any).people;
                    const residencia = people?.residencia ?? null;
                    let municipio: any = null;
                    if (people?.municipio) {
                        try {
                            const { countryExist, stateExist, citiExist } = await this.userService.normalizeMunicipio(people.municipio as any);
                            municipio = { country: countryExist, state: stateExist, city: citiExist };
                        } catch (_) {}
                    }
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user as any;
                    post.user = { id, username, profilePhoto, emailVerified, verified, createdAt, rol: roleName, residencia, municipio } as any;
                }

                if (userId && userId > 0) {
                    (post as any).userHasLiked = userLikedPostIds.has(post.id);
                }
                if (post.postLiked) {
                    (post as any).likesCount = post.postLiked.length;
                    const { postLiked, ...rest } = post;
                    post = rest as PostEntity;
                }

                return post;
            }));

            return enrichedPosts;
        } catch (error) {
            throw error;
        }
    }

    async deletePost(id: number, userId?: number, admin?: boolean): Promise<{ massage: string }> {
        const action = 'post.delete';
        const payload = { id, userId, admin };
        try {
            if (!id || id <= 0 || id === null || id === undefined) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'ID de post inválido', payload }), 400, payload);
                throw new BadRequestException('ID de post inválido');
            }
            id = Number(id);
            const post = await this.getPostById(id);
            if (!post) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Post no encontrado', payload }), 404, payload);
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'No tienes permiso para eliminar este post', payload }), 403, payload);
                throw new BadRequestException('No tienes permiso para eliminar este post');
            }
            const imagePost = post.imagePost;
            if (imagePost && imagePost.length > 0) {
                for (const img of imagePost) {
                    await this.imagePostService.deleteImageFromPost(id, img.id);
                }
            }
            await this.postRepository.delete(id);
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Post eliminado correctamente', payload, response: { id } }), 200, payload);
            return { massage: 'Post eliminado correctamente' };
        } catch (error) {
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: error?.message || 'Error al eliminar post', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }

    async getPostsByUserId(userId: number, userRequest?: number): Promise<PostEntity[]> {
        try {
            if (!userId || userId <= 0 || userId === null || userId === undefined) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const numericUserRequest = Number(userRequest);

            const qb = this.postRepository
                .createQueryBuilder('post')
                .leftJoinAndSelect('post.imagePost', 'imagePost')
                .leftJoinAndSelect('post.tags', 'postTags')
                .leftJoinAndSelect('postTags.tag', 'tag')
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.people', 'people')
                .leftJoinAndSelect('user.rol', 'userRol')
                .leftJoinAndSelect('post.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.article', 'article')
                .leftJoinAndSelect('postArticle.status', 'status')
                .leftJoinAndSelect('post.typePost', 'typePost')
                .where('user.id = :userId', { userId })
                // contar likes sin traer la relación completa
                .loadRelationCountAndMap('post.likesCount', 'post.postLiked');

            if (numericUserRequest && numericUserRequest > 0) {
                qb.loadRelationCountAndMap(
                    'post._userHasLikedCount',
                    'post.postLiked',
                    'liked',
                    (subQb) => subQb.andWhere('liked.user.id = :userRequest', { userRequest: numericUserRequest }),
                );
            }

            let posts = await qb.getMany();

            if (!posts || posts.length === 0) {
                throw new NotFoundException('El usuario no tiene posts');
            }

            // Procesar posts para normalizar usuario y mapear userHasLiked
            const enrichedPosts = await Promise.all(posts.map(async post => {
                // Normalizar información del usuario
                if (post.user) {
                    const roleName = (post.user as any).rol?.rol;
                    const people = (post.user as any).people;
                    const residencia = people?.residencia ?? null;
                    let municipio: any = null;
                    if (people?.municipio) {
                        try {
                            const { countryExist, stateExist, citiExist } = await this.userService.normalizeMunicipio(people.municipio as any);
                            municipio = { country: countryExist, state: stateExist, city: citiExist };
                        } catch (_) {}
                    }
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user as any;
                    post.user = { id, username, profilePhoto, emailVerified, verified, createdAt, rol: roleName, residencia, municipio } as any;
                }

                // Mapear userHasLiked a booleano y limpiar propiedad interna
                const internalCount = (post as any)._userHasLikedCount;
                if (internalCount !== undefined) {
                    (post as any).userHasLiked = Number(internalCount) > 0;
                    delete (post as any)._userHasLikedCount;
                } else if (numericUserRequest && numericUserRequest > 0) {
                    // Fallback: si no existe el campo mapeado, consultar directamente
                    (post as any).userHasLiked = false;
                }

                return post;
            }));

            return enrichedPosts;
        } catch (error) {
            throw error;
        }
    }

    async updatePost(id: number, data: any, userId?: number, admin?: boolean): Promise<PostEntity> {
        const action = 'post.update';
        const payload = { id, data, userId, admin };
        try {
            if (!id || id <= 0 || id === null || id === undefined) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'ID de post inválido', payload }), 400, payload);
                throw new BadRequestException('ID de post inválido');
            }
            console.log('data recibida para updatePost:', data);
            const post = await this.getPostById(id);
            if (!post) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Post no encontrado', payload }), 404, payload);
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'No tienes permiso para actualizar este post', payload }), 403, payload);
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            const { title, description, message } = data;
            if (title !== undefined) {
                post.title = title;
            }
            if (description !== undefined) {
                post.message = description;
            }
            if (message !== undefined) {
                post.message = message;
            }
            await this.postRepository.save(post);
            const result = await this.getPostById(id);
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: 'Post actualizado', payload, response: result }), 200, payload);
            return result;
        } catch (error) {
            await this.auditService.createLog(userId ?? null, action, JSON.stringify({ message: error?.message || 'Error al actualizar post', payload, response: error?.response }), error?.status || 500, payload);
            throw error;
        }
    }

    async updatePostType(id: number, typePostId: number, userId?: number, admin?: boolean): Promise<PostEntity> {
        try {
            if (!id || id <= 0 || id === null || id === undefined) {
                throw new BadRequestException('ID de post inválido');
            }
            const post = await this.getPostById(id);
            if (!post) {
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            const typePost = await this.typePostService.findById(typePostId);
            if (!typePost) {
                throw new NotFoundException('Tipo de post no encontrado');
            }
            post.typePost = typePost;
            await this.postRepository.save(post);
            return post;
        } catch (error) {
            throw error;
        }
    }

    async deleteImageFromPost(postId: number, imageId: number, userId?: number, admin?: boolean): Promise<{ message: string, status: number }> {
        try {
            if (!postId || postId <= 0 || postId === null || postId === undefined) {
                throw new BadRequestException('ID de post inválido');
            }
            const post = await this.getPostById(postId);
            if (!post) {
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            await this.imagePostService.deleteImageFromPost(postId, imageId);
            return { message: 'Imagen eliminada del post correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }

    async addImageToPost(postId: number, files: Express.Multer.File[], userId?: number, admin?: boolean): Promise<{ message: string, status: number }> {
        try {
            if (!postId || postId <= 0 || postId === null || postId === undefined) {
                throw new BadRequestException('ID de post inválido');
            }
            const post = await this.getPostById(postId);
            if (!post) {
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            let validateFilesErrors: any[] = [];
            for (const file of files) {
                const fileSizeValidation = await this.imagePostService.verifyFileSize(file);
                if ((fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 413) || (fileSizeValidation && fileSizeValidation.status && fileSizeValidation.status === 415)) {
                    validateFilesErrors.push(fileSizeValidation);
                }
            }
            if (validateFilesErrors.length > 0) {
                const errorMessages = validateFilesErrors.map((e: any) => e.message).join('; ');
                throw new HttpException({ message: `Algunos archivos son demasiado grandes: ${errorMessages}`, details: validateFilesErrors }, 413);
            }
            for (const file of files) {
                await this.imagePostService.addImageToPost(postId, file);
            }
            return { message: 'Imagen agregada al post correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }

    async addTagToPost(postId: number, tagId: number, userId?: number, admin?: boolean): Promise<{ message: string, status: number }> {
        try {
            if (!postId || postId <= 0 || postId === null || postId === undefined) {
                throw new BadRequestException('ID de post inválido');
            }
            const post = await this.getPostById(postId);
            if (!post) {
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            const tag = await this.tagsService.getTagById(tagId);
            if (!tag) {
                throw new NotFoundException('Etiqueta no encontrada');
            }
            await this.postTagsService.createPostTag(postId, tagId);
            return { message: 'Etiqueta agregada al post correctamente', status: 200 };
        } catch (error) {
            throw error;
        }

    }

    async removeTagFromPost(postId: number, tagId: number, userId?: number, admin?: boolean): Promise<{ message: string, status: number }> {
        try {
            if (!postId || postId <= 0 || postId === null || postId === undefined) {
                throw new BadRequestException('ID de post inválido');
            }
            const post = await this.getPostById(postId);
            if (!post) {
                throw new NotFoundException('Post no encontrado');
            }
            if (userId && post.user && post.user.id !== userId && !admin) {
                throw new BadRequestException('No tienes permiso para actualizar este post');
            }
            const tag = await this.tagsService.getTagById(tagId);
            if (!tag) {
                throw new NotFoundException('Etiqueta no encontrada');
            }
            await this.postTagsService.deleteTagFromPost(postId, tagId);
            return { message: 'Etiqueta eliminada del post correctamente', status: 200 };
        } catch (error) {
            throw error;
        }

    }

    async getPostsByFilters(filters: PostFilterDto, userId?: number): Promise<PostEntity[]> {
        try {
            const queryBuilder = this.postRepository.createQueryBuilder('post')
                .leftJoinAndSelect('post.user', 'user')
                .leftJoinAndSelect('user.people', 'people')
                .leftJoinAndSelect('post.imagePost', 'imagePost')
                .leftJoinAndSelect('post.tags', 'postTags')
                .leftJoinAndSelect('postTags.tag', 'tag')
                .leftJoinAndSelect('post.postArticle', 'postArticle')
                .leftJoinAndSelect('postArticle.article', 'article')
                .leftJoinAndSelect('postArticle.status', 'status')
                // load only likes count to avoid fetching full postLiked relation
                .loadRelationCountAndMap('post.likesCount', 'post.postLiked')
                .leftJoinAndSelect('post.typePost', 'typePost');
            if (filters.userName) {
                queryBuilder.andWhere('user.username ILIKE :userName', { userName: `%${filters.userName}%` });
            }
            if (filters.search) {
                queryBuilder.andWhere('(post.title ILIKE :search OR post.message ILIKE :search OR user.username ILIKE :search)', { search: `%${filters.search}%` });
            }
            if (filters.tags && filters.tags.length > 0) {
                queryBuilder.andWhere('tag.tag IN (:...tags)', { tags: filters.tags });
            }
            if (filters.typePost) {
                queryBuilder.andWhere('post.typePost = :typePost', { typePost: filters.typePost });
            }
            userId = Number(userId);
            const posts = await queryBuilder.getMany();
            if(!posts || posts.length===0){
                throw new NotFoundException('No se encontraron posts con los filtros proporcionados');
            }
            // compute which posts the user has liked in one query to avoid N queries
            let userLikedPostIds: Set<number> = new Set();
            if (userId && userId > 0) {
                const postIds = posts.map(p => p.id);
                if (postIds.length > 0) {
                    const likedRows: Array<{ id: number }> = await this.postRepository
                        .createQueryBuilder('post')
                        .innerJoin('post.postLiked', 'liked')
                        .where('post.id IN (:...postIds)', { postIds })
                        .andWhere('liked.user.id = :userId', { userId })
                        .select('post.id', 'id')
                        .getRawMany();

                    userLikedPostIds = new Set(likedRows.map(r => Number(r.id)));
                }
            }

            const postsWithUserInfo = await Promise.all(posts.map(async post => {
                if (post.user) {
                    const people = (post.user as any).people;
                    const residencia = people?.residencia ?? null;
                    let municipio: any = null;
                    if (people?.municipio) {
                        try {
                            const { countryExist, stateExist, citiExist } = await this.userService.normalizeMunicipio(people.municipio as any);
                            municipio = { country: countryExist, state: stateExist, city: citiExist };
                        } catch (_) {}
                    }
                    const { id, username, profilePhoto, emailVerified, verified, createdAt } = post.user as any;
                    post.user = { id, username, profilePhoto, emailVerified, verified, createdAt, residencia, municipio } as any;
                }
                if (userId && userId > 0) {
                    (post as any).userHasLiked = userLikedPostIds.has(post.id);
                }

                // ensure likesCount exists in the shaped response (from loadRelationCountAndMap)
                (post as any).likesCount = Number((post as any).likesCount ?? 0);
                return post;
            }));
            return postsWithUserInfo;
        } catch (error) {
            throw error;
        }
    }
}
