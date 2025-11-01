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
    @InjectRepository(StatusDonationEntity)
    private readonly statusDonationRepo: Repository<StatusDonationEntity>,
    private readonly statusDonationService: StatusdonationService,
    private readonly userService: UserService,
  ) {}

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

      // Validar que el usuario sea una organización verificada
      if (!user.verified) {
        throw new ForbiddenException('Solo organizaciones verificadas pueden crear donaciones');
      }

      // Crear la donación
      const donation = this.donationRepo.create({
        ...createDonationDto,
        user,
      });

      const saved = await this.donationRepo.save(donation);
      
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

  async updateDonation(id: number, updateDonationDto: UpdateDonationDto, currentUser: any): Promise<DonationEntity> {
    try {
      if (!id) throw new BadRequestException('El id de la donación es obligatorio');
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');

      const donation = await this.donationRepo.findOne({
        where: { id },
        relations: ['user', 'statusDonation'],
      });

      if (!donation) throw new NotFoundException('Donación no encontrada');

      // Validar permisos: solo el dueño o admin
      const isOwner = donation.user.id === currentUser.id;
      const isAdmin = currentUser.rol === 'admin' || (currentUser.rol && String(currentUser.rol).toLowerCase() === 'admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('No tienes permiso para actualizar esta donación');
      }

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
      const isAdmin = currentUser.rol === 'admin' || (currentUser.rol && String(currentUser.rol).toLowerCase() === 'admin');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('No tienes permiso para eliminar esta donación');
      }

      // Validar estado: si no es propietario pero es admin, puede eliminar sin restricción
      if (isOwner && !isAdmin) {
        const completedStatus = await this.statusDonationRepo.findOne({
          where: { status: 'completado' },
        });

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

      // permiso solo a propietario o admin
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
}
