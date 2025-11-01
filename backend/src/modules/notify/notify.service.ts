import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { NotifyEntity } from "./entity/notify.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateNotifyDto } from "./dto/create.notify.dto";
import { TypeNotifyService } from "../typenotify/typenotify.service";

@Injectable()
export class NotifyService {
   constructor(
      @InjectRepository(NotifyEntity)
      private readonly notifyRepository: Repository<NotifyEntity>,
      private readonly typeNotifyService: TypeNotifyService,
   ) { }

   async createNotify(dto: CreateNotifyDto): Promise<NotifyEntity> {
      try {
         if (!dto) throw new BadRequestException('Los datos son obligatorios');
         const { message, typeNotifyId } = dto;
         if (!message || message.trim().length === 0) throw new BadRequestException('El mensaje es obligatorio');
         if (!typeNotifyId || typeNotifyId <= 0) throw new BadRequestException('El id de tipo de notificación es inválido');
         const typeNotify = await this.typeNotifyService.getById(typeNotifyId);
         if (!typeNotify) throw new NotFoundException('El tipo de notificación no existe');
         const notify = this.notifyRepository.create({
            message: message,
            type: typeNotify,
         });
         const savedNotify = await this.notifyRepository.save(notify);
         if (dto.UsersIds && dto.UsersIds.length > 0) {
            const uniqueUserIds = Array.from(new Set(dto.UsersIds)).filter(
               (id) => id > 0,
            );
            if (uniqueUserIds.length === 0) throw new BadRequestException('La lista de usuarios es inválida');
            await this.userNotifyService.assignToUsers(savedNotify.id, uniqueUserIds);
         }
      } catch (error) {
         throw error;
      }
   }
}