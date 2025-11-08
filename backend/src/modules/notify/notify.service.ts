import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NotifyEntity } from "./entity/notify.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateNotifyDto } from "./dto/create.notify.dto";
import { TypeNotifyService } from "../typenotify/typenotify.service";
import { UserNotifyService } from "../userNotify/usernotify.service";
import { UserService } from "../user/user.service";
import { UpdateNotifyDto } from "./dto/update.notify.dto";
import { title } from "process";
import { NotifyGateway } from "./notify.gateway";
import { read } from "fs";
import { UserNotifyEntity } from "src/modules/userNotify/entity/user.notify.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";

@Injectable()
export class NotifyService {
   constructor(
      @InjectRepository(NotifyEntity)
      private readonly notifyRepository: Repository<NotifyEntity>,
      private readonly typeNotifyService: TypeNotifyService,
      @Inject(forwardRef(() => UserNotifyService))
      private readonly userNotifyService: UserNotifyService,
      private readonly userService: UserService,
      @Inject(forwardRef(() => NotifyGateway))
      private readonly notifyGateway: NotifyGateway,
   ) { }

   async findById(id: number): Promise<NotifyEntity> {
      try {
         if (id <= 0 || id === null || id === undefined || isNaN(id)) {
            throw new BadRequestException('El id de la notificación es inválido');
         }
         const notify = await this.notifyRepository.findOne({
            where: { id },
            relations: {
               type: true,
               userNotify: {
                  user: true,
               }
            }
         });
         if (!notify) throw new NotFoundException('Notificación no encontrada');
         if (notify.userNotify && notify.userNotify.length > 0) {
            notify.userNotify = notify.userNotify.map(userNotify => {
               if (userNotify.user) {
                  const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } = userNotify.user as any;
                  userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } as any;
               }
               return userNotify;
            });
         }
         return notify;
      } catch (error) {
         throw error;
      }
   }
   async findAllNotifies(): Promise<NotifyEntity[]> {
      try {
         const notifies = await this.notifyRepository.find({
            relations: {
               type: true,
               userNotify: {
                  user: true,
               }
            }
         });
         if (!notifies || !notifies.length) throw new NotFoundException('No hay notificaciones registradas');
         const notifiesWithFilteredUsers = notifies.map(notify => {
            if (notify.userNotify && notify.userNotify.length > 0) {
               notify.userNotify = notify.userNotify.map(userNotify => {
                  if (userNotify.user) {
                     const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } = userNotify.user as any;
                     userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } as any;
                  }
                  return userNotify;
               });
            }
            return notify;
         });
         return notifiesWithFilteredUsers;
      } catch (error) {
         throw error;
      }
   }

   async createNotify(dto: CreateNotifyDto): Promise<NotifyEntity> {
      try {
         if (!dto) throw new BadRequestException('Los datos son obligatorios');
         const { message, typeNotifyId, title } = dto;
         if (!message || message.trim().length === 0) throw new BadRequestException('El mensaje es obligatorio');
         if(!title || title.trim().length ===0) throw new BadRequestException('El título es obligatorio');
         if (!typeNotifyId || typeNotifyId <= 0) throw new BadRequestException('El id de tipo de notificación es inválido');
         const typeNotify = await this.typeNotifyService.getById(typeNotifyId);
         if (!typeNotify) throw new NotFoundException('El tipo de notificación no existe');
         if (!dto.usersIds || dto.usersIds.length === 0) {
            throw new BadRequestException('Debe especificar al menos un usuario');
         }
         const uniqueUserIds = Array.from(new Set(dto.usersIds)).filter(
            (id) => id > 0,
         );
         if (uniqueUserIds.length === 0) throw new BadRequestException('La lista de usuarios es inválida');
         const validUsers = await this.userNotifyService.validateUsersExist(uniqueUserIds);
         if (validUsers.length === 0) throw new NotFoundException('Ninguno de los usuarios especificados existe');
         const cleanLink = dto.link?.trim();
         const notify = this.notifyRepository.create({
            title: title.trim(),
            message: message.trim(),
            type: typeNotify,
            ...(cleanLink ? { link: cleanLink } : {}),
         });
         const savedNotify = await this.notifyRepository.save(notify);
         await this.userNotifyService.assignToUsers(savedNotify.id, uniqueUserIds);
         const findNotify = await this.findById(savedNotify.id);
         
         this.notifyGateway.sendNotificationToUsers(uniqueUserIds, {
            id: findNotify.id,
            title: findNotify.title,
            message: findNotify.message,
            type: findNotify.type,
            createdAt: findNotify.createdAt,
            link: findNotify.link || null,
            data: {
               notificationId: findNotify.id,
               typeId: findNotify.type.id,
               typeName: findNotify.type.type,
            }
         });

         return findNotify;
      } catch (error) {
         throw error;
      }
   }

   async findByUserId(userId: number): Promise<NotifyEntity[]> {
      try {
         if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new BadRequestException('El id de usuario es inválido');
         }
         userId = Number(userId);

         const existUser = await this.userService.findById(userId);
         if (!existUser) throw new NotFoundException('Usuario no encontrado');

         await this.userNotifyService.validateUsersExist([userId]);

         const notifies = await this.notifyRepository.createQueryBuilder('notify')
            .leftJoinAndSelect('notify.type', 'type')
            .leftJoinAndSelect('notify.userNotify', 'userNotify')
            .leftJoinAndSelect('userNotify.user', 'user')
            .where('user.id = :userId', { userId })
            .orderBy('notify.createdAt', 'DESC')
            .getMany();

         if (!notifies || notifies.length === 0) {
            throw new NotFoundException('El usuario no tiene notificaciones');
         }

         const sanitized = notifies.map(notify => {
            if (notify.userNotify && notify.userNotify.length > 0) {
               notify.userNotify = notify.userNotify.map(userNotify => {
                  if (userNotify.user) {
                     const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } = userNotify.user as any;
                     userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt, read } as any;
                  }
                  return userNotify;
               });
            }
            return notify;
         });

         return sanitized;
      } catch (error) {
         throw error;
      }
   }

   async updateNotify(id: number, dto: UpdateNotifyDto): Promise<NotifyEntity> {
      try {
         if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            throw new BadRequestException('El id de la notificación es inválido');
         }
         id = Number(id);

         if (!dto || Object.keys(dto).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
         }

         const existingNotify = await this.notifyRepository.findOne({
            where: { id },
            relations: { type: true }
         });
         if (!existingNotify) {
            throw new NotFoundException('Notificación no encontrada');
         }
         if( dto.title){
            if( dto.title.trim().length !==0){
               existingNotify.title = dto.title.trim();
            }
         }

         if (dto.message !== undefined) {
            if (!dto.message || dto.message.trim().length === 0) {
               throw new BadRequestException('El mensaje no puede estar vacío');
            }
            existingNotify.message = dto.message.trim();
         }

         if (dto.typeNotifyId !== undefined) {
            if (dto.typeNotifyId <= 0) {
               throw new BadRequestException('El id de tipo de notificación es inválido');
            }
            const typeNotify = await this.typeNotifyService.getById(dto.typeNotifyId);
            if (!typeNotify) {
               throw new NotFoundException('El tipo de notificación especificado no existe');
            }
            existingNotify.type = typeNotify;
         }

         const updatedNotify = await this.notifyRepository.save(existingNotify);

         const finalNotify = await this.findById(updatedNotify.id);

         // Emitir actualización en tiempo real a los usuarios afectados
         if (finalNotify.userNotify && finalNotify.userNotify.length > 0) {
            const userIds = finalNotify.userNotify.map(un => un.user.id);
            this.notifyGateway.sendNotificationToUsers(userIds, {
               id: finalNotify.id,
               title: finalNotify.title,
               message: finalNotify.message,
               type: finalNotify.type,
               createdAt: finalNotify.createdAt,
               updatedAt: finalNotify.updatedAt,
               action: 'updated',
               data: {
                  notificationId: finalNotify.id,
                  typeId: finalNotify.type.id,
                  typeName: finalNotify.type.type,
               }
            });
         }

         return finalNotify;
      } catch (error) {
         throw error;
      }
   }

   async deleteNotify(id: number): Promise<{ message: string }> {
      try {
         if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            throw new BadRequestException('El id de la notificación es inválido');
         }
         id = Number(id);

         const existingNotify = await this.notifyRepository.findOne({
            where: { id },
            relations: {
               type: true,
               userNotify: {
                  user: true,
               }
            }
         });

         if (!existingNotify) {
            throw new NotFoundException('Notificación no encontrada');
         }

         // Obtener userIds antes de eliminar
         const userIds = existingNotify.userNotify?.map(un => un.user.id) || [];

         if (existingNotify.userNotify && existingNotify.userNotify.length > 0) {
            await this.userNotifyService.deleteByNotifyId(id);
         }

         await this.notifyRepository.remove(existingNotify);

         // Notificar a los usuarios que la notificación fue eliminada
         if (userIds.length > 0) {
            this.notifyGateway.sendNotificationToUsers(userIds, {
               action: 'deleted',
               notificationId: id,
               message: 'Una notificación ha sido eliminada',
            });
         }

         return {
            message: 'Notificación eliminada exitosamente'
         };
      } catch (error) {
         throw error;
      }
   }

   async createNotifyForAllUsers(dto: CreateNotifyDto): Promise<NotifyEntity> {
      try {
             if (!dto) throw new BadRequestException('Los datos son obligatorios');
             const { message, typeNotifyId, title } = dto;
             if (!message || message.trim().length === 0) throw new BadRequestException('El mensaje es obligatorio');
             if (!title || title.trim().length === 0) throw new BadRequestException('El título es obligatorio');
             if (!typeNotifyId || typeNotifyId <= 0) throw new BadRequestException('El id de tipo de notificación es inválido');

             const typeNotify = await this.typeNotifyService.getById(typeNotifyId);
             if (!typeNotify) throw new NotFoundException('El tipo de notificación no existe');

             const userRepo = this.notifyRepository.manager.getRepository(UserEntity);
             const rawIds = await userRepo.createQueryBuilder('u')
                .select('u.id', 'id')
                .getRawMany();
             const allUserIds: number[] = rawIds.map(r => Number(r.id)).filter(id => id > 0);
             if (allUserIds.length === 0) throw new NotFoundException('No hay usuarios para notificar');

             const savedNotify = await this.notifyRepository.manager.transaction(async (manager) => {
                const cleanLink = dto.link?.trim();
                const notify = manager.create(NotifyEntity, { 
                   title: title.trim(), 
                   message: message.trim(), 
                   type: typeNotify, 
                   ...(cleanLink ? { link: cleanLink } : {})
                });
                const persisted = await manager.save(NotifyEntity, notify);
                const chunkSize = 1000;
                for (let i = 0; i < allUserIds.length; i += chunkSize) {
                   const chunk = allUserIds.slice(i, i + chunkSize);
                   const values = chunk.map(uid => ({ user: { id: uid }, notify: { id: persisted.id }, read: false }));
                   await manager.createQueryBuilder()
                      .insert()
                      .into(UserNotifyEntity)
                      .values(values as any)
                      .execute();
                }

                return persisted;
             });

             const payload = {
                id: savedNotify.id,
                title: savedNotify.title,
                message: savedNotify.message,
                type: typeNotify,
                createdAt: savedNotify.createdAt,
                link: savedNotify.link || null,
                data: {
                   notificationId: savedNotify.id,
                   typeId: typeNotify.id,
                   typeName: typeNotify.type,
                }
             };
             const emitChunk = 5000;
             for (let i = 0; i < allUserIds.length; i += emitChunk) {
                const usersChunk = allUserIds.slice(i, i + emitChunk);
                this.notifyGateway.sendNotificationToUsers(usersChunk, payload);
             }

             return await this.findById(savedNotify.id);
      } catch (error) {
         throw error;
      }
   }
}