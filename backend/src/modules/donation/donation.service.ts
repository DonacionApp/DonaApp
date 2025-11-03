import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationEntity } from './entity/donation.entity';
import { Repository } from 'typeorm';
import { StatusDonationEntity } from '../statusdonation/entity/status.donation.entity';
import { UserService } from '../user/user.service';
import { StatusdonationService } from '../statusdonation/statusdonation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepo: Repository<DonationEntity>,
    private readonly statusDonationService: StatusdonationService,
    private readonly userService: UserService,
  ) { }

  async getDonationById(id: number): Promise<DonationEntity> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: ['user', 'statusDonation'],
      });
      if (!donation) throw new NotFoundException('Donación no encontrada');
      // Remover campos sensibles del usuario
      if (donation.user) {
        const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = donation.user as any;
        donation.user = userWithoutSensitive as any;
      }
      return donation;
    } catch (error) {
      throw error;
    }
  }

  async createDonation(createDonationDto: CreateDonationDto, currentUser: any): Promise<DonationEntity> {
    try {
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      // Validar campos requeridos
      if (!createDonationDto.lugarRecogida) {
        throw new BadRequestException('El lugar de recogida es obligatorio');
      }

      // Obtener usuario completo desde la base de datos para validar verificación
      const user = await this.userService.findById(currentUser.sub || currentUser.id);
      if (!user) throw new NotFoundException('Usuario no encontrado');
      let idDonationStatus= createDonationDto.statusDonation;
      if(!idDonationStatus || idDonationStatus<=0 || isNaN(idDonationStatus)){
        throw new BadRequestException('El estado de donación es obligatorio y debe ser un id válido');
      }
      idDonationStatus=Number(idDonationStatus);
      const existEstatus= await this.statusDonationService.findById(idDonationStatus);
      if(!existEstatus){
        throw new NotFoundException('El estado de donación proporcionado no existe');
      }

      // Validar que el usuario sea una organización verificada
      if (!user.verified) {
        throw new ForbiddenException('Solo organizaciones verificadas pueden crear donaciones');
      }

      const donationData: any = { ...createDonationDto };
      // Reemplazar el campo statusDonation (viene como id) por la entidad encontrada
      donationData.statusDonation = existEstatus;
      donationData.user = user;
      const donation = this.donationRepo.create(donationData);

      // TypeORM save can sometimes return an array (depending on input/overloads), normalize to a single entity
      const savedRaw = await this.donationRepo.save(donation);
      const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;
      if(!saved){
        throw new BadRequestException('No se pudo crear la donación');
      }
      // Remover campos sensibles
      if (saved.user) {
        const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = saved.user as any;
        saved.user = userWithoutSensitive as any;
      }

      return saved;
    } catch (error) {
      throw error;
    }
  }

  async getUserDonations(userId: number): Promise<DonationEntity[]> {
    try {
      if (!userId) throw new BadRequestException('El id del usuario es obligatorio');

      const donations = await this.donationRepo.find({
        where: { user: { id: userId } },
        relations: ['user', 'statusDonation'],
      });

      // Remover campos sensibles de todos los usuarios
      donations.forEach(donation => {
        if (donation.user) {
          const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = donation.user as any;
          donation.user = userWithoutSensitive as any;
        }
      });

      return donations;
    } catch (error) {
      throw error;
    }
  }

  async getDonationsByUser(idUser: number): Promise<DonationEntity[]> {
    try {
      return await this.getUserDonations(idUser);
    } catch (error) {
      throw error;
    }
  }

  async updateDonation(id: number, updateDonationDto: UpdateDonationDto, currentUser?: any): Promise<DonationEntity> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
        const donation = await this.donationRepo.findOne({
        where: { id },
        relations: ['user', 'statusDonation'],
      });

      if (currentUser) {
        const isOwner = donation?.user.id === currentUser.id;

        if (!isOwner) {
          throw new ForbiddenException('No tienes permiso para actualizar esta donación');
        }
      }
      if (!donation) throw new NotFoundException('Donación no encontrada');

      // Actualizar campos
      Object.assign(donation, updateDonationDto);
      const updated = await this.donationRepo.save(donation);

      // Remover campos sensibles
      if (updated.user) {
        const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = updated.user as any;
        updated.user = userWithoutSensitive as any;
      }

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async deleteDonation(id: number, currentUser: any): Promise<{ message: string }> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: ['user', 'statusDonation'],
      });

      if (!donation) throw new NotFoundException('Donación no encontrada');

      // Validar permisos
      const isOwner = donation.user.id === currentUser.id;

      if (!isOwner) {
        throw new ForbiddenException('No tienes permiso para eliminar esta donación');
      }

      // Validar estado: si no es propietario pero es admin, puede eliminar sin restricción
      if (isOwner) {
        const completedStatus = await this.statusDonationService.findByname('completada')

        if (donation.statusDonation && completedStatus && donation.statusDonation.id === completedStatus.id) {
          throw new ForbiddenException('No se puede eliminar una donación con estado completado');
        }
      }

      await this.donationRepo.delete(id);
      return { message: 'Donación eliminada correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async deleteAdminDonation(id: number): Promise<{ message: string }> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');

      const donation = await this.donationRepo.findOne({ where: { id } });
      if (!donation) throw new NotFoundException('Donación no encontrada');

      await this.donationRepo.delete(id);
      return { message: 'Donación eliminada correctamente por admin' };
    } catch (error) {
      throw error;
    }
  }

  async changeStatus(donationId: number, newStatus: number, currentUser?: any): Promise<DonationEntity> {
    try {
      if (!donationId) throw new BadRequestException('El id de la donación es obligatorio');
      if (!newStatus) throw new BadRequestException('El estado es obligatorio');

      const donation = await this.donationRepo.findOne({
        where: { id: donationId },
        relations: ['user', 'statusDonation'],
      });
      if (!donation) throw new NotFoundException('Donación no encontrada');

      const statusEntity = await this.statusDonationService.findById(newStatus);
      if (!statusEntity) throw new NotFoundException('Estado no encontrado en la base de datos');

      if (currentUser) {
        const isOwner = donation.user && currentUser && donation.user.id === currentUser.id;
        if (!isOwner) throw new ForbiddenException('No tienes permiso para cambiar el estado');
      }

      const oldStatus = donation.statusDonation?.status ?? null;
      donation.statusDonation = statusEntity;
      const updated = await this.donationRepo.save(donation);
      if (updated.user) {
        const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = updated.user as any;
        updated.user = userWithoutSensitive;
      }
      return updated;
    } catch (error) {
      throw error;
    }
  }

  async getDonationHistory(currentUser: any, filters: any): Promise<DonationEntity[]> {
    try {
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const userId =filters.userId ? filters.userId : currentUser.id;

      let query = this.donationRepo.createQueryBuilder('d')
        .leftJoinAndSelect('d.user', 'user')
        .leftJoinAndSelect('d.statusDonation', 'statusDonation');

      // Filtro por usuario
      query = query.where('d.userId = :userId', { userId });

      // Filtro por rango de fechas
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          query = query.andWhere('d.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          query = query.andWhere('d.createdAt <= :endDate', { endDate });
        }
      }

      // Filtro de búsqueda por campos específicos
      if (filters.searchParam && filters.typeSearch && filters.typeSearch.length > 0) {
        const searchTerm = `%${filters.searchParam}%`;
        const conditions: string[] = [];

        for (const field of filters.typeSearch) {
          if (field === 'lugar') {
            conditions.push(`(d.lugarRecogida ILIKE :searchTerm OR d.lugarDonacion ILIKE :searchTerm)`);
          } else if (field === 'articulos.content') {
            conditions.push(`(d.articles::text ILIKE :searchTerm)`);
          }
        }

        if (conditions.length > 0) {
          query = query.andWhere(`(${conditions.join(' OR ')})`);
          query = query.setParameter('searchTerm', searchTerm);
        }
      }

      // Ordenamiento
      if (filters.orderBy) {
        const orderField = filters.orderBy === 'createdAt' || filters.orderBy === 'updatedAt'
          ? `d.${filters.orderBy}`
          : 'd.createdAt';
        query = query.orderBy(orderField, 'DESC');
      } else {
        query = query.orderBy('d.createdAt', 'DESC');
      }

      const donations = await query.getMany();

      // Remover campos sensibles
      donations.forEach(donation => {
        if (donation.user) {
          const { password, block, code, dateSendCodigo, lockUntil, loginAttempts, token, ...userWithoutSensitive } = donation.user as any;
          donation.user = userWithoutSensitive as any;
        }
      });

      return donations;
    } catch (error) {
      throw error;
    }
  }
}
