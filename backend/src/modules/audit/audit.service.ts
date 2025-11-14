import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntity } from './entity/audit.entity';
import { UserEntity } from '../user/entity/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { QueryAuditDto } from './dto/query-audit.dto';

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
 // si usuario es admin puede ver cualquier usuario, si no solo puede ver el suyo
  async findByUser(
    targetUserId: number,
    dto: QueryAuditDto,
    currentUserId: number,
    isAdmin = false,
  ) {
    if (!isAdmin && targetUserId !== currentUserId) {
      throw new ForbiddenException('No autorizado para ver las acciones de este usuario');
    }

    const qb = this.auditRepository.createQueryBuilder('audit').leftJoinAndSelect('audit.user', 'user');
    qb.where('user.id = :userId', { userId: targetUserId });

    if (dto.action) qb.andWhere('audit.action ILIKE :action', { action: `%${dto.action}%` });
    if (dto.username) qb.andWhere('user.username ILIKE :username', { username: `%${dto.username}%` });
    if (dto.minDate) qb.andWhere('audit.createdAt >= :minDate', { minDate: dto.minDate });
    if (dto.maxDate) qb.andWhere('audit.createdAt <= :maxDate', { maxDate: dto.maxDate });

    // Filtro para solo acciones relacionadas con chats/mensajes
    if (dto.onlyChats) {
      qb.andWhere("(audit.action ILIKE :chat OR audit.action ILIKE :message)", { chat: '%chat%', message: '%message%' });
    }

  const order = dto.order ? (dto.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') : 'DESC';
    qb.orderBy('audit.createdAt', order as 'ASC' | 'DESC');

    // paginacion 
  let take = dto.limit ?? 20;
  // limite maximo para evitar consultas pesadas
  const MAX_LIMIT = 100;
  if (take > MAX_LIMIT) take = MAX_LIMIT;
    let skip = 0;
    if (typeof dto.offset === 'number') {
      skip = dto.offset;
    } else if (typeof dto.page === 'number' && dto.page > 0) {
      skip = (dto.page - 1) * take;
    }
    qb.take(take).skip(skip);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        total,
        limit: take,
        offset: skip,
      },
    };
  }
}
