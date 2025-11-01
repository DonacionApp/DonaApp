import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotifyEntity } from "./entity/notify.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateNotifyDto } from "./dto/create.notify.dto";
import { TypeNotifyService } from "../typenotify/typenotify.service";
import { UserNotifyService } from "../userNotify/usernotify.service";

@Injectable()
export class NotifyService {
   constructor(
      @InjectRepository(NotifyEntity)
      private readonly notifyRepository: Repository<NotifyEntity>,
      private readonly typeNotifyService: TypeNotifyService,
      private readonly userNotifyService: UserNotifyService,
   ) { }

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
         return savedNotify;
      } catch (error) {
         throw error;
      }
   }
}