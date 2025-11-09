import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { UserEntity } from "../user/entity/user.entity";
import { NotifyEntity } from "../notify/entity/notify.entity";
import { NotifyService } from "../notify/notify.service";
import { FiltersNotifyDto } from "./dto/filters.notify.dto";

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
         const userNotifications = await this.userNotifyRepository.find({ where: { notify: { id: notifyId } } });
         if (userNotifications.length > 0) {
            await this.userNotifyRepository.remove(userNotifications);
         }
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

   async deleteMyNotification(userId: number, notifyId: number): Promise<{ message: string }> {
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
            }
         });

         if (!userNotification) {
            throw new ForbiddenException('No tienes permiso para eliminar esta notificacion');
         }

         await this.userNotifyRepository.remove(userNotification);
         
         const remaining = await this.userNotifyRepository.count({ where: { notify: { id: notifyId } } });
         if (remaining === 0) {
            const notifyRepo = this.userNotifyRepository.manager.getRepository(NotifyEntity);
            await notifyRepo.delete(notifyId);
         }
         console.log(`Notificación eliminada y verificación de notificación huérfana realizada ${notifyId} con ${remaining} restantes.`);

         return {
            message: 'Notificación eliminada exitosamente'
         };
      } catch (error) {
         throw error;
      }
   }

   async markAsRead(userId: number, notifyId: number): Promise<{ message: string }> {
      try {
         if (!userId || isNaN(Number(userId)) || Number(userId) <= 0) {
            throw new BadRequestException('El id de usuario es inválido');
         }
         userId = Number(userId);
         if (!notifyId || isNaN(Number(notifyId)) || Number
            (notifyId) <= 0) {
            throw new BadRequestException('El id de notificación es inválido');
         }
         notifyId = Number(notifyId);

         await this.userService.findById(userId);
         await this.notifyService.findById(notifyId);
         const userNotification = await this.userNotifyRepository.findOne({
            where: {
               user: { id: userId },
               notify: { id: notifyId }
            }
         });
         if (!userNotification) {
            throw new ForbiddenException('No tienes permiso para modificar esta notificacion');
         }
         userNotification.read = true;
         await this.userNotifyRepository.save(userNotification);
         return {
            message: 'Notificación marcada como leída exitosamente'
         };
      }
      catch (error) {
         throw error;
      }
   }

   async markAllAsRad(userId: number, admin?: boolean): Promise<{ message: string, status: number, updated: number }> {
      try {
         const parsedUserId = Number(userId);
         if (!parsedUserId || isNaN(parsedUserId) || parsedUserId <= 0) {
            throw new BadRequestException('El id de usuario es inválido');
         }
         await this.userService.findById(parsedUserId);
         const updateResult = await this.userNotifyRepository.createQueryBuilder()
            .update(UserNotifyEntity)
            .set({ read: true })
            .where('userId = :userId', { userId: parsedUserId })
            .andWhere('read = :read', { read: false })
            .execute();

         const affected = updateResult.affected ?? 0;
         return {
            message: affected > 0
               ? `Se marcaron ${affected} notificaciones como leídas`
               : 'No había notificaciones pendientes por marcar',
            status: 200,
            updated: affected
         };
      } catch (error) {
         throw error;
      }
   }

   async getMyNotifications(userId:number, filters?:FiltersNotifyDto):Promise<NotifyEntity[]>{
      try {
         if(!userId || isNaN(Number(userId)) || Number(userId) <= 0){
            throw new BadRequestException('El id de usuario es inválido');
         }
         userId=Number(userId);
         await this.userService.findById(userId);
         const f: FiltersNotifyDto = (filters as FiltersNotifyDto) || {} as any;
         const queryBuilder = this.userNotifyRepository.createQueryBuilder('userNotify')
            .leftJoinAndSelect('userNotify.notify', 'notify')
            .leftJoinAndSelect('notify.type', 'type')
            .leftJoinAndSelect('userNotify.user','user')
            .where('userNotify.userId = :userId', { userId });
         if(f.read!==undefined){
            queryBuilder.andWhere('userNotify.read = :read', { read: f.read });
         }
         if(f.type!==undefined){
            queryBuilder.andWhere('type.id = :typeId', { typeId: f.type });
         }
         if(f.search){
            queryBuilder.andWhere('(notify.message ILIKE :search OR notify.title ILIKE :search)', { search: `%${f.search}%` });
         }
         queryBuilder.orderBy('notify.createdAt', 'DESC');
         if( f.minDate){
            queryBuilder.andWhere('notify.createdAt >= :minDate', { minDate: f.minDate });
         }
         if( f.maxDate){
            queryBuilder.andWhere('notify.createdAt <= :maxDate', { maxDate: f.maxDate });
         }
         const userNotifications = await queryBuilder.getMany();
         if (!userNotifications || userNotifications.length === 0) {
            throw new NotFoundException('El usuario no tiene notificaciones');
         }
         const notifications = userNotifications.map((un) => {
            const u:any = un.user || {};
            const sanitizedUser = {
               id: u.id,
               username: u.username,
               email: u.email,
               profilePhoto: u.profilePhoto,
               emailVerified: u.emailVerified,
               verified: u.verified,
               lastLogin: u.lastLogin,
               createdAt: u.createdAt,
            };
            return {
               id: un.notify?.id,
               title: un.notify?.title,
               message: un.notify?.message,
               type: un.notify?.type ? { id: un.notify.type.id, type: un.notify.type.type } : null,
               read: un.read,
               user: sanitizedUser,
               createdAt: un.notify?.createdAt,
            } as any;
         });
         return notifications as any;
      } catch (error) {
         throw error;
      }
   }

}