export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function buildPaginationMeta(total: number, page: number, limit: number, offset: number): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  const hasMore = offset + limit < total;
  return { total, limit, offset, page, totalPages, hasMore };
}
