import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DonationEntity } from './entity/donation.entity';
import { Repository } from 'typeorm';
import { StatusDonationEntity } from '../statusdonation/entity/status.donation.entity';
import { NotifyEntity } from '../notify/entity/notify.entity';
import { TypeNotifyEntity } from '../typenotify/entity/type.notify.entity';
import { UserNotifyEntity } from '../userNotify/entity/user.notify.entity';
import { AuditEntity } from '../audit/entity/audit.entity';
import { UserEntity } from '../user/entity/user.entity';
import { EventsService } from 'src/core/events/events.service';
import { UserService } from '../user/user.service';
import { StatusdonationService } from '../statusdonation/statusdonation.service';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepo: Repository<DonationEntity>,
    private readonly statusDonationService: StatusdonationService,
  ) {}

  async changeStatus(donationId: number, newStatus: number, currentUser?: any):Promise<DonationEntity> {
    if (!donationId) throw new BadRequestException('El id de la donación es obligatorio');
    if (!newStatus) throw new BadRequestException('El estado es obligatorio');

    const donation = await this.donationRepo.findOne({
      where: { id: donationId },
      relations: ['user', 'statusDonation'],
    });
    if (!donation) throw new NotFoundException('Donación no encontrada');

    const statusEntity = await this.statusDonationService.findById(newStatus)
    if (!statusEntity) throw new NotFoundException('Estado no encontrado en la base de datos');

    // permiso sollo a propietario o admin
    if (currentUser) {
      const isOwner = donation.user && currentUser && donation.user.id === currentUser.id;
      if ( !isOwner) throw new ForbiddenException('No tienes permiso para cambiar el estado');
    }

    const oldStatus = donation.statusDonation?.status ?? null;
    donation.statusDonation = statusEntity;
    const updated = await this.donationRepo.save(donation);
    if (updated.user) {
      const { password, block,code,dateSendCodigo,lockUntil,loginAttempts,token, ...userWithoutSensitive } = updated.user as any;
      updated.user = userWithoutSensitive;
    }
    return updated;
  }
}
