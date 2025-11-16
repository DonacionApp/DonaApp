import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class ExportAuditDto {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : value))
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsIn(['xlsx', 'csv'])
  format?: 'xlsx' | 'csv';

  @ValidateIf((dto) => dto.fromDate !== undefined || dto.toDate !== undefined)
  @IsDateString()
  fromDate?: string;

  @ValidateIf((dto) => dto.fromDate !== undefined || dto.toDate !== undefined)
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
