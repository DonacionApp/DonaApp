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

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepo: Repository<DonationEntity>,
    @InjectRepository(StatusDonationEntity)
    private readonly statusRepo: Repository<StatusDonationEntity>,
    @InjectRepository(NotifyEntity)
    private readonly notifyRepo: Repository<NotifyEntity>,
    @InjectRepository(TypeNotifyEntity)
    private readonly typeNotifyRepo: Repository<TypeNotifyEntity>,
    @InjectRepository(UserNotifyEntity)
    private readonly userNotifyRepo: Repository<UserNotifyEntity>,
    @InjectRepository(AuditEntity)
    private readonly auditRepo: Repository<AuditEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly eventsService: EventsService,
  ) {}

  async changeStatus(donationId: number, newStatus: string, currentUser: any) {
    if (!donationId) throw new BadRequestException('El id de la donación es obligatorio');
    if (!newStatus) throw new BadRequestException('El estado es obligatorio');

    const donation = await this.donationRepo.findOne({
      where: { id: donationId },
      relations: ['user', 'statusDonation'],
    });
    if (!donation) throw new NotFoundException('Donación no encontrada');

    const statusEntity = await this.statusRepo.findOne({ where: { status: newStatus } });
    if (!statusEntity) throw new NotFoundException('Estado no encontrado en la base de datos');

    // permiso sollo a propietario o admin
    const isAdmin = currentUser?.rol === 'admin' || (currentUser?.rol && String(currentUser.rol).toLowerCase() === 'admin');
    const isOwner = donation.user && currentUser && donation.user.id === currentUser.id;
    if (!isAdmin && !isOwner) throw new ForbiddenException('No tienes permiso para cambiar el estado');

    const oldStatus = donation.statusDonation?.status ?? null;
    donation.statusDonation = statusEntity;
    const updated = await this.donationRepo.save(donation);

    // crear o recuperar tipo de notificación cuando haya cambio de estado
    let typeNotify = await this.typeNotifyRepo.findOne({ where: { type: 'status_changed' } });
    if (!typeNotify) {
      typeNotify = this.typeNotifyRepo.create({ type: 'status_changed' });
      typeNotify = await this.typeNotifyRepo.save(typeNotify);
    }

    // crear notificación para el usuario
    const message = `Donación ${donation.id} cambiado a ${statusEntity.status}`;
    const notify = this.notifyRepo.create({ message, type: typeNotify });
    const savedNotify = await this.notifyRepo.save(notify);

    // vincular notificación al usuario propietario de la donación
    const userNotify = this.userNotifyRepo.create({ user: donation.user, notify: savedNotify });
    await this.userNotifyRepo.save(userNotify);

    // registrar auditoría (opcional) 
    try {
      const audit = this.auditRepo.create({
        user: currentUser,
        action: 'update_status',
        comment: `Cambio de estado de ${oldStatus ?? 'null'} a ${statusEntity.status} (donation:${donation.id})`,
        status: statusEntity.status,
      });
      await this.auditRepo.save(audit);
    } catch (err) {
      // si la auditoría falla, no interrumpe la operación principal
      console.warn('No se pudo registrar auditoría:', err?.message ?? err);
    }

    // emitir evento de cambio de estado 
    try {
      this.eventsService.emit('status_changed', {
        donationId: donation.id,
        oldStatus,
        newStatus: statusEntity.status,
        userId: currentUser?.id,
      });
    } catch (err) {
      console.warn('Error emitiendo evento de cambio de estado', err?.message ?? err);
    }

    return updated;
  }
}
