import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentSupportIdEntity } from './entity/comment.supportid.entity';
import { Repository } from 'typeorm';
import { StatussupportidService } from '../statussupportid/statussupportid.service';
import { UserService } from '../user/user.service';
import { NotifyService } from '../notify/notify.service';
import { TypeNotifyService } from '../typenotify/typenotify.service';
import { createCommentSupportIdDto } from './dto/create.comment.dto';
import { FilterSearchCommentSupportIdDto } from './dto/filter.search.dto';
import { UpdateUserDto } from '../user/dto/update.user.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CommentsupportidService {
    constructor(
        @InjectRepository(CommentSupportIdEntity)
        private readonly commentSupportIdRepository: Repository<CommentSupportIdEntity>,
        private readonly statusSupportIdService: StatussupportidService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => NotifyService))
        private readonly notifyService: NotifyService,
        @Inject(forwardRef(() => TypeNotifyService))
        private readonly typeNotifyService: TypeNotifyService,
        @Inject(forwardRef(() => AuditService))
        private readonly auditService: AuditService,
    ) { }

    async createCommentSupportId(dto: createCommentSupportIdDto): Promise<Omit<CommentSupportIdEntity, 'user'>> {
        try {
            if (!dto.comment || !dto.idStatusSupportId || !dto.idUser) {
                throw new BadRequestException('Faltan datos obligatorios');
            };
            const statusSupportId = await this.statusSupportIdService.getStatusSupportIdById(dto.idStatusSupportId);
            if (!statusSupportId) {
                throw new BadRequestException('El estado de soporte con ID proporcionado no existe');
            }
            const user = await this.userService.findById(dto.idUser);
            if (!user) {
                throw new BadRequestException('El usuario con ID proporcionado no existe');
            }
            if (user.verified === true) {
                throw new BadRequestException('El usuario ya está verificado, no se puede agregar un comentario de soporte');
            }
            const acceptStatus = await this.statusSupportIdService.getStatusSupportIdByName('aceptado');
            let acceptComment = await this.commentSupportIdRepository.findOne({
                where: {
                    user: {
                        id: user.id
                    },
                },
                relations: {
                    status: true
                }
            });
            if (acceptComment && acceptComment.status.id === acceptStatus.id) {
                throw new BadRequestException('El usuario ya ha sido aceptado, no se pueden agregar más comentarios de soporte');
            }
            if (acceptComment) {
                acceptComment.comment = dto.comment;
                acceptComment.status = statusSupportId;
            } else {
                acceptComment = this.commentSupportIdRepository.create({
                    comment: dto.comment,
                    status: statusSupportId,
                    user: user,
                });
            }
            const savedComment = await this.commentSupportIdRepository.save(acceptComment);
            await this.auditService.createLog(
                dto.idUser,
                'createCommentSupportId',
                JSON.stringify({
                    message: 'Comentario de soporte creado',
                    payload: { comment: dto.comment, idStatusSupportId: dto.idStatusSupportId },
                    response: { id: savedComment.id }
                }),
                201,
                { comment: dto.comment, idStatusSupportId: dto.idStatusSupportId }
            );
            const { user: _user, ...commentWithoutUser } = savedComment;
            return commentWithoutUser;

        } catch (error) {
            await this.auditService.createLog(
                dto.idUser || 0,
                'createCommentSupportId',
                JSON.stringify({
                    message: 'Error al crear comentario de soporte',
                    payload: { comment: dto.comment, idStatusSupportId: dto.idStatusSupportId },
                    response: error?.message || error
                }),
                error?.status || 500,
                { comment: dto.comment, idStatusSupportId: dto.idStatusSupportId }
            );
            throw error;
        }


    }

    async getCommentsByUserId(idUser: number): Promise<CommentSupportIdEntity> {
        try {
            if (!idUser || isNaN(idUser) || idUser === undefined || idUser <= 0) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const comments = await this.commentSupportIdRepository.findOne({
                where: {
                    user: {
                        id: idUser
                    }
                },
                relations: {
                    status: true
                }
            });
            if (!comments) {
                throw new BadRequestException('No se encontraron comentarios para el ID de usuario proporcionado');
            }
            return comments;
        } catch (error) {
            throw error;
        }

    }

    async getAllCommentsSupportId(filter: FilterSearchCommentSupportIdDto): Promise<CommentSupportIdEntity[]> {
        try {
            const queryBuilder = this.commentSupportIdRepository.createQueryBuilder('comment');
            queryBuilder.leftJoinAndSelect('comment.status', 'status');
            queryBuilder.leftJoinAndSelect('comment.user', 'user');
            if (filter.idStatusSupportId) {
                queryBuilder.andWhere('status.id = :idStatusSupportId', { idStatusSupportId: filter.idStatusSupportId });
            }
            if (filter.idUser) {
                queryBuilder.andWhere('user.id = :idUser', { idUser: filter.idUser });
            }
            if (filter.search) {
                queryBuilder.andWhere('comment.comment ILIKE :search OR user.username ILIKE :search', { search: `%${filter.search}%` });
            }
            if (filter.sortBy) {
                queryBuilder.orderBy(`comment.${filter.sortBy}`, filter.sortOrder === 'DESC' ? 'DESC' : 'ASC');
            }
            const comments = await queryBuilder.getMany();
            if (comments.length === 0) {
                throw new BadRequestException('No se encontraron comentarios con los filtros proporcionados');
            }
            const commentsFiltered = comments.map(({ user, ...comment }) => {
                if (!user) return comment;
                const { token, loginAttempts, password, lockUntil, dateSendCodigo, code, updatedAt, ...userRest } = user as any;
                return { ...comment, user: userRest };
            });
            return commentsFiltered as any;
        } catch (error) {
            throw error;
        }
    }

    async updateCommentSupportId(idComment: number, newComment: string): Promise<{ message: string, status: number, commentUp: string }> {
        try {
            if (!idComment || isNaN(idComment) || idComment <= 0) {
                throw new BadRequestException('comentario inválido');
            }
            if (!newComment || newComment.trim().length === 0) {
                throw new BadRequestException('El nuevo comentario no puede estar vacío');
            }
            const comment = await this.commentSupportIdRepository.findOne({
                where: {
                    id: idComment
                }
            });
            if (!comment) {
                throw new NotFoundException('El comentario con ID proporcionado no existe');
            }
            comment.comment = newComment;
            await this.commentSupportIdRepository.save(comment);
            const userId = comment.user?.id || 0;
            await this.auditService.createLog(
                userId,
                'updateCommentSupportId',
                JSON.stringify({
                    message: 'Comentario de soporte actualizado',
                    payload: { idComment, newComment },
                    response: { idComment, newComment }
                }),
                200,
                { idComment, newComment }
            );
            return {
                message: 'Comentario actualizado exitosamente',
                status: 200,
                commentUp: comment.comment
            };
        } catch (error) {
            await this.auditService.createLog(
                0,
                'updateCommentSupportId',
                JSON.stringify({
                    message: 'Error al actualizar comentario de soporte',
                    payload: { idComment, newComment },
                    response: error?.message || error
                }),
                error?.status || 500,
                { idComment, newComment }
            );
            throw error;
        }
    }

    async deleteCommentSupportId(idComment: number): Promise<{ message: string, status: number }> {
        try {
            if (!idComment || isNaN(idComment) || idComment <= 0) {
                throw new BadRequestException('comentario inválido');
            }
            const comment = await this.commentSupportIdRepository.findOne({
                where: {
                    id: idComment
                }
            });
            if (!comment) {
                throw new NotFoundException('El comentario con ID proporcionado no existe');
            }
            await this.commentSupportIdRepository.remove(comment);
            const userId = comment.user?.id || 0;
            await this.auditService.createLog(
                userId,
                'deleteCommentSupportId',
                JSON.stringify({
                    message: 'Comentario de soporte eliminado',
                    payload: { idComment },
                    response: { idComment }
                }),
                200,
                { idComment }
            );
            return {
                message: 'Comentario eliminado exitosamente',
                status: 200
            };
        } catch (error) {
            await this.auditService.createLog(
                0,
                'deleteCommentSupportId',
                JSON.stringify({
                    message: 'Error al eliminar comentario de soporte',
                    payload: { idComment },
                    response: error?.message || error
                }),
                error?.status || 500,
                { idComment }
            );
            throw error;
        }
    }

    async acceptSupportId(userId: number, comments: string): Promise<{ message: string, status: number }> {
        try {
            if (!userId || isNaN(userId) || userId <= 0) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const user = await this.userService.findById(userId);
            if (!user) {
                throw new NotFoundException('El usuario con ID proporcionado no existe');
            }
            if(user.verified === true){
                throw new BadRequestException('El usuario ya está verificado');
            }
            const acceptStatus = await this.statusSupportIdService.getStatusSupportIdByName('aceptado');
            user.verified = true;
            const userUpdated = new UpdateUserDto();
            userUpdated.verified = true;
            await this.userService.update(user.id, userUpdated, false);

            // If a comment for this user already exists, update it. Otherwise create a new one.
            let existingComment = await this.commentSupportIdRepository.findOne({
                where: {
                    user: { id: user.id }
                },
                relations: { status: true }
            }).catch(() => null);

            if (existingComment) {
                existingComment.comment = comments;
                existingComment.status = acceptStatus;
                await this.commentSupportIdRepository.save(existingComment);
            } else {
                const created = this.commentSupportIdRepository.create({
                    comment: comments,
                    status: acceptStatus,
                    user: user,
                });
                await this.commentSupportIdRepository.save(created);
            }
            const typeNotify = await this.typeNotifyService.getByType('informaacion')
            if (!typeNotify) {
                throw new NotFoundException('El tipo de notificación no existe');
            };
            await this.notifyService.createNotify({
                title: 'Soporte de identificación aceptado',
                message: 'Tu documento de soporte ha sido aceptado. Ahora estás verificado en la plataforma.',
                typeNotifyId: typeNotify.id,
                usersIds: [user.id],
                link: null,
            })
            await this.auditService.createLog(
                userId,
                'acceptSupportId',
                JSON.stringify({
                    message: 'Soporte de identificación aceptado',
                    payload: { userId, comments },
                    response: { userId }
                }),
                200,
                { userId, comments }
            );
            return { message: 'Soporte aceptado correctamente', status: 200 };
        } catch (error) {
            await this.auditService.createLog(
                userId || 0,
                'acceptSupportId',
                JSON.stringify({
                    message: 'Error al aceptar soporte de identificación',
                    payload: { userId, comments },
                    response: error?.message || error
                }),
                error?.status || 500,
                { userId, comments }
            );
            throw error;
        }
    }

    async rejectSupportId(userId: number, comment: string): Promise<{ message: string, status: number }> {
        try {
            if (!userId || isNaN(userId) || userId <= 0) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const user = await this.userService.findById(userId);
            if(user.verified === true){
                throw new BadRequestException('El usuario ya está verificado');
            }
            const rejectStatus = await this.statusSupportIdService.getStatusSupportIdByName('rechazado');

            // If a comment for this user already exists, update it. Otherwise create a new one.
            let existingComment = await this.commentSupportIdRepository.findOne({
                where: {
                    user: { id: user.id }
                },
                relations: { status: true }
            }).catch(() => null);

            if (existingComment) {
                existingComment.comment = comment;
                existingComment.status = rejectStatus;
                await this.commentSupportIdRepository.save(existingComment);
            } else {
                const createdComment = this.commentSupportIdRepository.create({
                    comment: comment,
                    status: rejectStatus,
                    user: user,
                });
                await this.commentSupportIdRepository.save(createdComment);
            }
            const typeNotify = await this.typeNotifyService.getByType('alerta')
            if (typeNotify) {
                await this.notifyService.createNotify({
                    title: 'Soporte de identificación rechazado',
                    message: 'Tu documento de soporte ha sido rechazado. Por favor, revisa el comentario para más detalles.',
                    typeNotifyId: typeNotify.id,
                    usersIds: [user.id],
                    link: null,
                })
            }
            await this.auditService.createLog(
                userId,
                'rejectSupportId',
                JSON.stringify({
                    message: 'Soporte de identificación rechazado',
                    payload: { userId, comment },
                    response: { userId }
                }),
                200,
                { userId, comment }
            );
            return { message: 'Soporte rechazado correctamente', status: 200 };
        } catch (error) {
            await this.auditService.createLog(
                userId || 0,
                'rejectSupportId',
                JSON.stringify({
                    message: 'Error al rechazar soporte de identificación',
                    payload: { userId, comment },
                    response: error?.message || error
                }),
                error?.status || 500,
                { userId, comment }
            );
            throw error;
        }
    }
}
