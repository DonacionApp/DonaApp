import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PeopleEntity } from 'src/modules/people/entity/people.entity';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsNumber()
  rolId: number;

  @IsNotEmpty()
  @IsNumber()
  people: PeopleEntity;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsBoolean()
  block?: boolean;

  @IsOptional()
  @IsString()
  verificationCode?: string | null;

  @IsOptional()
  @IsBoolean()
  isVerifiedEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  token:string | null;

  @IsOptional()
  @IsString()
  code:string | null;
  @IsOptional()
  dateSendCodigo:Date | null;

}
