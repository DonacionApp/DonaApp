import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotifyEntity } from "./entity/notify.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateNotifyDto } from "./dto/create.notify.dto";
import { TypeNotifyService } from "../typenotify/typenotify.service";
import { UserNotifyService } from "../userNotify/usernotify.service";
import { UserService } from "../user/user.service";

@Injectable()
export class NotifyService {
   constructor(
      @InjectRepository(NotifyEntity)
      private readonly notifyRepository: Repository<NotifyEntity>,
      private readonly typeNotifyService: TypeNotifyService,
      private readonly userNotifyService: UserNotifyService,
      private readonly userService: UserService,
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
                  const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } = userNotify.user;
                  userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } as any;
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
                     const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } = userNotify.user;
                     userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } as any;
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
         const { message, typeNotifyId } = dto;
         if (!message || message.trim().length === 0) throw new BadRequestException('El mensaje es obligatorio');
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
         const notify = this.notifyRepository.create({
            message: message,
            type: typeNotify,
         });
         const savedNotify = await this.notifyRepository.save(notify);
         await this.userNotifyService.assignToUsers(savedNotify.id, uniqueUserIds);
         const findNotify = await this.findById(savedNotify.id);
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
                     const { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } = userNotify.user as any;
                     userNotify.user = { id, username, email, profilePhoto, emailVerified, verified, createdAt, updatedAt } as any;
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
}