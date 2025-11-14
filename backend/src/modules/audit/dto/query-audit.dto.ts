import { IsOptional, IsString, IsIn, IsNumber, IsNumberString } from 'class-validator';

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
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
// esto es para paginacion via pagina
  @IsOptional()
  @IsNumber()
  page?: number;
// es el usuario nombre para filtrar
  @IsOptional()
  @IsString()
  username?: string;
}
