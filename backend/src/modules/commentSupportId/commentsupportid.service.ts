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

@Injectable()
export class CommentsupportidService {
    constructor(
        @InjectRepository(CommentSupportIdEntity)
        private readonly commentSupportIdRepository: Repository<CommentSupportIdEntity>,
        private readonly statusSupportIdService: StatussupportidService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => NotifyService))
        private readonly notifyService: NotifyService,
        @Inject(forwardRef(() => TypeNotifyService))
        private readonly typeNotifyService: TypeNotifyService,
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
            const { user: _user, ...commentWithoutUser } = savedComment;
            return commentWithoutUser;

        } catch (error) {
            throw error;
        }


    }

    async getCommentsByUserId(idUser: number): Promise<CommentSupportIdEntity[]> {
        try {
            if (!idUser || isNaN(idUser) || idUser === undefined || idUser <= 0) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const comments = await this.commentSupportIdRepository.find({
                where: {
                    user: {
                        id: idUser
                    }
                },
                relations: {
                    status: true
                }
            });
            if (comments.length === 0) {
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
            return {
                message: 'Comentario actualizado exitosamente',
                status: 200,
                commentUp: comment.comment
            };
        } catch (error) {
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
            return {
                message: 'Comentario eliminado exitosamente',
                status: 200
            };
        } catch (error) {
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
            const acceptStatus = await this.statusSupportIdService.getStatusSupportIdByName('aceptado');
            user.verified = true;
            const userUpdated = new UpdateUserDto();
            userUpdated.verified = true;
            await this.userService.update(user.id, userUpdated, false);
            await this.commentSupportIdRepository.save({
                comment: comments,
                status: acceptStatus,
            });
            await this.commentSupportIdRepository.save({
                comment: comments,
                status: acceptStatus,
            });
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
            return { message: 'Soporte aceptado correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }

    async rejectSupportId(userId: number, comment: string): Promise<{ message: string, status: number }> {
        try {
            if (!userId || isNaN(userId) || userId <= 0) {
                throw new BadRequestException('ID de usuario inválido');
            }
            const user = await this.userService.findById(userId);
            const rejectStatus = await this.statusSupportIdService.getStatusSupportIdByName('rechazado');
            const createdComment = await this.commentSupportIdRepository.create({
                comment: comment,
                status: rejectStatus,
                user: user,
            });
            await this.commentSupportIdRepository.save(createdComment);
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

            return { message: 'Soporte rechazado correctamente', status: 200 };
        } catch (error) {
            throw error;
        }
    }
}
