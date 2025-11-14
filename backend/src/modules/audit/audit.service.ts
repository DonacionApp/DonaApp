import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntity } from './entity/audit.entity';
import { UserEntity } from '../user/entity/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEntity)
    private readonly auditRepository: Repository<AuditEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createLog(
    userId: number,
    action: any,
    comment: string,
    statusCode: number | string,
    payload?: any,
  ): Promise<AuditEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado para el log de auditoría');

    const log = new AuditEntity();
    log.user = user;
    log.action = typeof action === 'string' ? action : JSON.stringify(action);
    log.comment = comment ?? '';
    log.status = String(statusCode ?? '');
    if (payload) {
      try {
        log.comment = `${log.comment} | payload: ${JSON.stringify(payload)}`;
      } catch (e) {}
    }

    return await this.auditRepository.save(log);
  }

  async findAll(filter: { userId?: number; action?: string; from?: string; to?: string }) {
    const qb = this.auditRepository.createQueryBuilder('audit').leftJoinAndSelect('audit.user', 'user');
    if (filter.userId) qb.andWhere('user.id = :userId', { userId: filter.userId });
    if (filter.action) qb.andWhere('audit.action ILIKE :action', { action: `%${filter.action}%` });
    if (filter.from) qb.andWhere('audit.createdAt >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('audit.createdAt <= :to', { to: filter.to });
    qb.orderBy('audit.createdAt', 'DESC');
    return qb.getMany();
  }
}
