import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, IsObject } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  @IsNotEmpty()
  lugarRecogida: string;

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
