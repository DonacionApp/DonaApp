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

  private normalizeAuditLog(audit: AuditEntity) {
    const safeUser = audit.user
      ? {
          id: audit.user.id,
          username: audit.user.username,
          email: audit.user.email,
        }
      : null;
    let commentStr = audit.comment;
    if (typeof commentStr === 'string' && commentStr.includes('| payload:')) {
      commentStr = commentStr.split('| payload:')[0].trim();
    }
    let parsedComment: any = commentStr;
    try {
      parsedComment = JSON.parse(commentStr);
      if (parsedComment && parsedComment.response && parsedComment.response.access_token) {
        delete parsedComment.response.access_token;
      }
    } catch {
      parsedComment = commentStr;
    }
    return {
      id: audit.id,
      user: safeUser,
      action: audit.action,
      comment: parsedComment,
      status: audit.status,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    };
  }

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
    const data = await qb.getMany();
    return data.map(audit => this.normalizeAuditLog(audit));
  }
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
      data: data.map(audit => this.normalizeAuditLog(audit)),
      meta: {
        total,
        limit: take,
        offset: skip,
      },
    };
  }

  // Eliminar un registro de auditoría por su id
  async deleteAuditById(auditId: number, adminId: number) {
    const audit = await this.auditRepository.findOne({ where: { id: auditId }, relations: ['user'] });
    if (!audit) return { deleted: 0, message: 'Registro de auditoría no encontrado' };
    await this.auditRepository.delete(auditId);
    return { deleted: 1, message: 'Registro de auditoría eliminado', auditId };
  }

  // Eliminar la actividad de los primeros 30 días de un usuario
  async deleteUserFirst30Days(userId: number, adminId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { deleted: 0, message: 'Usuario no encontrado' };

    const createdAt = user.createdAt;
    const threshold = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    // solo permitir si el usuario ha estado al menos 30 días en el sistema
    if (now < threshold) {
      return { deleted: 0, message: 'Usuario no ha alcanzado los 30 días en el sistema' };
    }

    // eliminar auditorías entre createdAt y threshold
    const res = await this.auditRepository.createQueryBuilder()
      .delete()
      .from(AuditEntity)
      .where('userId = :userId', { userId })
      .andWhere('createdAt >= :start AND createdAt <= :end', { start: createdAt.toISOString(), end: threshold.toISOString() })
      .execute();

    return { deleted: res.affected ?? 0, message: 'Eliminada actividad de los primeros 30 días' };
  }

  // Eliminar actividad de un usuario en un rango de fechas
  async deleteUserRange(userId: number, minDate: string, maxDate: string, adminId: number) {
    const min = new Date(minDate);
    const max = new Date(maxDate);
    if (isNaN(min.getTime()) || isNaN(max.getTime()) || min > max) return { deleted: 0, message: 'Invalid date range' };

    const res = await this.auditRepository.createQueryBuilder()
      .delete()
      .from(AuditEntity)
      .where('userId = :userId', { userId })
      .andWhere('createdAt >= :min AND createdAt <= :max', { min: min.toISOString(), max: max.toISOString() })
      .execute();

    return { deleted: res.affected ?? 0, message: 'Actividad en el rango eliminada' };
  }

  // Eliminar actividad en rango para todos los usuarios (admin)
  async deleteRangeAll(minDate: string, maxDate: string, adminId: number) {
    const min = new Date(minDate);
    const max = new Date(maxDate);
    if (isNaN(min.getTime()) || isNaN(max.getTime()) || min > max) return { deleted: 0, message: 'Invalid date range' };

    const res = await this.auditRepository.createQueryBuilder()
      .delete()
      .from(AuditEntity)
      .where('createdAt >= :min AND createdAt <= :max', { min: min.toISOString(), max: max.toISOString() })
      .execute();

    return { deleted: res.affected ?? 0, message: 'Eliminada actividad en rango para todos los usuarios' };
  }
}
