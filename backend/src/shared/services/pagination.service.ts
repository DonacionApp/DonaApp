import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
import { buildPaginationMeta, PaginationMeta } from '../helpers/pagination-meta.helper';

export interface NormalizedPagination {
  take: number;
  skip: number;
  page: number;
  limit: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class PaginationService {
  normalizeOptions(dto: PaginationDto = {}): NormalizedPagination {
    let take = dto.limit ?? DEFAULT_LIMIT;
    if (take > MAX_LIMIT) take = MAX_LIMIT;

    let skip = 0;
    if (typeof dto.offset === 'number') {
      skip = dto.offset;
    } else if (typeof dto.page === 'number' && dto.page > 0) {
      skip = (dto.page - 1) * take;
    }

    let page = 1;
    if (typeof dto.offset === 'number') {
      page = take > 0 ? Math.floor(dto.offset / take) + 1 : 1;
    } else if (typeof dto.page === 'number' && dto.page > 0) {
      page = dto.page;
    }

    return { take, skip, page, limit: take };
  }

  applyOrder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: PaginationDto = {}, allowedColumns?: string[]): SelectQueryBuilder<T> {
    const { sortBy, order } = dto;
    if (!sortBy) return qb;

    const column = allowedColumns?.includes(sortBy) ? sortBy : undefined;
    if (!column) return qb;

    const direction = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(column, direction as 'ASC' | 'DESC');
    return qb;
  }

  applyPagination<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: PaginationDto = {}): { qb: SelectQueryBuilder<T>; normalized: NormalizedPagination } {
    const normalized = this.normalizeOptions(dto);
    qb.take(normalized.take).skip(normalized.skip);
    return { qb, normalized };
  }

  async paginate<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: PaginationDto = {}, allowedColumns?: string[]): Promise<{ items: T[]; total: number; page: number; limit: number; hasMore: boolean; meta: PaginationMeta }> {
    this.applyOrder(qb, dto, allowedColumns);
    const { qb: paginatedQb, normalized } = this.applyPagination(qb, dto);
    const [items, total] = await paginatedQb.getManyAndCount();
    const meta = buildPaginationMeta(total, normalized.page, normalized.limit, normalized.skip);
    return { items, total, page: normalized.page, limit: normalized.limit, hasMore: meta.hasMore, meta };
  }
}
