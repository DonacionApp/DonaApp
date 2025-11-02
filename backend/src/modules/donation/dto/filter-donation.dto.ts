import { IsOptional, IsString, IsArray, IsDateString, IsIn } from 'class-validator';

export class FilterDonationDto {
  @IsOptional()
  @IsString()
  orderBy?: string; // Campo para ordenar

  @IsOptional()
  @IsString()
  searchParam?: string; // Parámetro de búsqueda

  @IsOptional()
  @IsArray()
  @IsIn(['lugar', 'articulos.content'], { each: true })
  typeSearch?: string[]; // Campos donde buscar

  @IsOptional()
  @IsDateString()
  startDate?: string; // Fecha inicial del rango

  @IsOptional()
  @IsDateString()
  endDate?: string; // Fecha final del rango
}
