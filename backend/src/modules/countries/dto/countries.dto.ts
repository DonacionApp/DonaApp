import { IsNotEmpty, IsOptional } from 'class-validator';

export class CountryDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  iso2: string;

  @IsNotEmpty()
  iso3: string;

  @IsOptional()
  phonecode?: string;

  @IsOptional()
  capital?: string;

  @IsOptional()
  currency?: string;

  @IsOptional()
  native?: string;

  @IsOptional()
  emoji?: string;

  constructor(partial: Partial<CountryDto>) {
    Object.assign(this, partial);
  }
}
