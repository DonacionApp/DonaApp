import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteUserAuditDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  auditId?: number;

  @IsOptional()
  @IsBoolean()
  first30Day?: boolean;

  @IsOptional()
  @IsString()
  minDate?: string;

  @IsOptional()
  @IsString()
  maxDate?: string;
}
