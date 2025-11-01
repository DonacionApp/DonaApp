import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { UserEntity } from "../user/entity/user.entity";

@Injectable()
export class UserNotifyService {
   constructor(
      @InjectRepository(UserNotifyEntity)
      private readonly userNotifyRepository: Repository<UserNotifyEntity>,
      private readonly userService: UserService,
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
}