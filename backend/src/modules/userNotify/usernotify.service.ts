import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { UserEntity } from "../user/entity/user.entity";
import { NotifyEntity } from "../notify/entity/notify.entity";
import { NotifyService } from "../notify/notify.service";

@Injectable()
export class UserNotifyService {
   constructor(
      @InjectRepository(UserNotifyEntity)
      private readonly userNotifyRepository: Repository<UserNotifyEntity>,
      private readonly userService: UserService,
      @Inject(forwardRef(() => NotifyService))
      private readonly notifyService: NotifyService,
   ) { }

   async validateUsersExist(usersIds: number[]): Promise<UserEntity[]> {
      if (!Array.isArray(usersIds) || usersIds.length === 0) throw new BadRequestException('Debe especificar al menos un usuario');
      const uniqueUserIds = Array.from(new Set(usersIds)).filter(
         (id) => id > 0,
      );
      if (uniqueUserIds.length === 0) throw new BadRequestException('La lista de usuarios es inválida');
      const validUsers: UserEntity[] = [];
      for (const userId of uniqueUserIds) {
         try {
            const user = await this.userService.findById(userId);
            if (user) {
               validUsers.push(user);
            }
         } catch {

         }
      }
      return validUsers;
   }

   async assignToUsers(notifyId: number, usersIds: number[]): Promise<UserNotifyEntity[]> {
      try {
         if (!notifyId || notifyId <= 0) throw new BadRequestException('El id de notificación es inválido');
         const validUsers = await this.validateUsersExist(usersIds);
         if (validUsers.length === 0) throw new NotFoundException('Ninguno de los usuarios especificados existe');
         const userNotifications = validUsers.map(
            (user) => this.userNotifyRepository.create({
               user: user,
               notify: { id: notifyId },
            })
         );
         return await this.userNotifyRepository.save(userNotifications);
      } catch (error) {
         throw error;
      }
   }

   async deleteByNotifyId(notifyId: number): Promise<void> {
      try {
         if (!notifyId || notifyId <= 0) {
            throw new BadRequestException('El id de notificación es inválido');
         }

         const userNotifications = await this.userNotifyRepository.find({
            where: { notify: { id: notifyId } }
         });

         if (userNotifications.length > 0) {
            await this.userNotifyRepository.remove(userNotifications);
         }
      } catch (error) {
         throw error;
      }
   }

   async getMyNotifications(userId: number): Promise<NotifyEntity[]> {
      try {
         if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new BadRequestException('El id de usuario es inválido');
         }
         userId = Number(userId);

         await this.userService.findById(userId);

         const userNotifications = await this.userNotifyRepository.find({
            where: { user: { id: userId } },
            relations: {
               notify: {
                  type: true
               }
            },
            order: {
               createdAt: 'DESC'
            }
         });

         if (!userNotifications || userNotifications.length === 0) {
            throw new NotFoundException('El usuario no tiene notificaciones');
         }

         const notifications = userNotifications.map(userNotify => userNotify.notify);

         return notifications;
      } catch (error) {
         throw error;
      }
   }

   async getMyNotificationById(userId: number, notifyId: number): Promise<NotifyEntity> {
      try {
         if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new BadRequestException('El id de usuario es inválido');
         }
         userId = Number(userId);

         if (!notifyId || isNaN(Number(notifyId)) || Number(notifyId) <= 0) {
            throw new BadRequestException('El id de notificación es inválido');
         }
         notifyId = Number(notifyId);

         await this.userService.findById(userId);
         await this.notifyService.findById(notifyId);

         const userNotification = await this.userNotifyRepository.findOne({
            where: {
               user: { id: userId },
               notify: { id: notifyId }
            },
            relations: {
               notify: {
                  type: true
               }
            }
         });

         if (!userNotification) {
            throw new ForbiddenException('No tienes acceso a esta notificacion');
         }

         return userNotification.notify;
      } catch (error) {
         throw error;
      }
   }
}