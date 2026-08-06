import { IsNotEmpty, IsOptional } from 'class-validator';

export class CountryDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  iso2: string;

  @IsOptional()
  iso3?: string | null;

  @IsOptional()
  phonecode?: string | null;

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
