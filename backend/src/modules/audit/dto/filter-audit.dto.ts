import { IsOptional, IsNumberString } from 'class-validator';

export class FilterAuditDto {
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @IsOptional()
  action?: string;

  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;
}
