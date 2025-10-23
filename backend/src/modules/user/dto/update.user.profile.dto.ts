import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  residencia?: string;

  @IsOptional()
  @IsString()
  @Length(6, 15)
  telefono?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
