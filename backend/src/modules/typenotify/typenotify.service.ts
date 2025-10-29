import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeNotifyEntity } from "./entity/type.notify.entity";
import { Not, Repository } from "typeorm";

@Injectable()
export class TypeNotifyService {
   constructor (
      @InjectRepository(TypeNotifyEntity)
      private readonly typeNotifyRepository: Repository<TypeNotifyEntity>,
   ) {}

   async createTypeNotify(typeNotify: string): Promise<TypeNotifyEntity> {
      try {
         if (!typeNotify) throw new BadRequestException('Tipo de notificación obligatorio');
         if (typeof typeNotify !== 'string') throw new BadRequestException('Tipo de notificación debe ser un string');
         if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(typeNotify)) throw new BadRequestException('Solo se permiten letras');
         typeNotify=typeNotify.trim().toLowerCase();
         const exist = await this.typeNotifyRepository.findOne({ where: { type: typeNotify } });
         if (exist) throw new ConflictException('Tipo de notificación ya existe');
         const newTypeNotify = this.typeNotifyRepository.create({ type: typeNotify });
         return await this.typeNotifyRepository.save(newTypeNotify);

      } catch (error) {
         throw error;
      }
   }

   async getAllTypeNotifies(): Promise<TypeNotifyEntity[]> {
      try {
         const typeNotifies = await this.typeNotifyRepository.find();
         if (!typeNotifies.length) throw new NotFoundException('No hay tipos de notificaciones registrados');
         return typeNotifies;
      } catch (error) {
         throw error;
      }
   }

   async getById(id: number): Promise<TypeNotifyEntity> {
      try {
         if (!id) throw new BadRequestException('El ID es obligatorio');
         if (typeof id !== 'number') throw new BadRequestException('El ID debe ser un número');
         const typeNotify = await this.typeNotifyRepository.findOne({ where: { id: id } });
         if (!typeNotify) throw new NotFoundException('Tipo de notificación no encontrada');
         return typeNotify;
      } catch (error) {
         throw error;
      }
   }

   async getByType(type: string): Promise<TypeNotifyEntity> {
      try {
         if (!type) throw new BadRequestException('El tipo de notificación es obligatorio');
         if (typeof type !== 'string') throw new BadRequestException('El tipo de notificación debe ser un string');
         type=type.trim().toLowerCase();
         const typeNotify = await this.typeNotifyRepository.findOne({ where: { type: type } });
         if (!typeNotify) throw new NotFoundException('Tipo de notificación no encontrada');
         return typeNotify;
      } catch (error) {
         throw error;
      }
   }

   async updateTypeNotify(id: number, typeNotify: string): Promise<TypeNotifyEntity> {
      try {
         if (!id) throw new BadRequestException('El ID es obligatorio');
         if (typeof id !== 'number') throw new BadRequestException('El ID debe ser un número');
         if (!typeNotify) throw new BadRequestException('Tipo de notificación obligatorio');
         if (typeof typeNotify !== 'string') throw new BadRequestException('Tipo de notificación debe ser un string');
         if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(typeNotify)) throw new BadRequestException('Solo se permiten letras');
         typeNotify=typeNotify.trim().toLowerCase();
         const existTypeNotify = await this.getById(id);
         if (!existTypeNotify) throw new NotFoundException('Tipo de notificación no encontrada');
         const exist = await this.typeNotifyRepository.findOne({ where: { type: typeNotify, id: Not(id)}});
         if (exist && exist.id !== id) throw new ConflictException('Tipo de notificación ya existe');
         existTypeNotify.type = typeNotify;
         return await this.typeNotifyRepository.save(existTypeNotify);
      } catch (error) {
         throw error;
      }
   }

   async deleteTypeNotify(id: number): Promise<any> {
      try {
         if (!id) throw new BadRequestException('El ID es obligatorio');
         if (typeof id !== 'number') throw new BadRequestException('El ID debe ser un número');
         const existTypeNotify = await this.getById(id);
         if (!existTypeNotify) throw new NotFoundException('Tipo de notificación no encontrada');
         await this.typeNotifyRepository.delete(id);
         return { message: 'Tipo de notificación eliminada correctamente' };
      } catch (error) {
         throw error;
      }
   }
}