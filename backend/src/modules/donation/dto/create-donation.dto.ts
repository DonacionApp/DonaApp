import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateDonationDto {
  @IsNotEmpty()
  @IsNumber()
  postId: number;
  @IsString()
  @IsNotEmpty()
  lugarRecogida: string;

  @IsString()
  @IsOptional()
  lugarDonacion?: string;

  @IsArray()
  @IsOptional()
  articles?: [{articlePostId: number, quantity: number}];

  @IsArray()
  @IsOptional()
  comments?: any[];

  @IsNotEmpty()
  @IsNumber()
  statusDonation: number;

  @IsString()
  @IsOptional()
  comunity?: string;

  @IsDateString()
  @IsOptional()
  fechaMaximaEntrega?: string;
}
