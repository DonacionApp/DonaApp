import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
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
  @Min(1)
  rolId: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreatePeopleDto)
  people: CreatePeopleDto;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsBoolean()
  block?: boolean;
}
