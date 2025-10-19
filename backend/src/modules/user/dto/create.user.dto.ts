import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreatePeopleDto } from 'src/modules/people/dto/create.people.dto';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  rolId: number;

  @IsNotEmpty()
  @IsNumber()
  people: CreatePeopleDto;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsBoolean()
  block?: boolean;
}
