import { BadRequestException, Module } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserNotifyEntity } from "./entity/user.notify.entity";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";
import { UserEntity } from "../user/entity/user.entity";

@Module({})
export class UserNotifyModule {
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
}