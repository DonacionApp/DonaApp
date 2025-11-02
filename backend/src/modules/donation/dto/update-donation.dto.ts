import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class UpdateDonationDto {
  @IsString()
  @IsOptional()
  lugarRecogida?: string;

  @IsString()
  @IsOptional()
  lugarDonacion?: string;

  @IsArray()
  @IsOptional()
  articles?: any[];

  @IsArray()
  @IsOptional()
  comments?: any[];

  @IsString()
  @IsOptional()
  comunity?: string;

  @IsDateString()
  @IsOptional()
  fechaMaximaEntrega?: string;
}
