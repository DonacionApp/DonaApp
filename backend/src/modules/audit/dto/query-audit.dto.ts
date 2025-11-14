import { IsOptional, IsString, IsIn, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryAuditDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';

  @IsOptional()
  @IsString()
  maxDate?: string; 

  @IsOptional()
  @IsString()
  minDate?: string;
//pone el limite de registros a devolver
  @IsOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
// esto es para paginacion via pagina
  @IsOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;
// es el usuario nombre para filtrar
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  onlyChats?: boolean;
}
