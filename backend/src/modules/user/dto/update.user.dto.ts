import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { UpdatePeopleDto } from 'src/modules/people/dto/update.people.dto';
import { PeopleEntity } from 'src/modules/people/entity/people.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  location:{
        lat:number,
        lng:number
    } | null;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  rolId: number;

  @IsOptional()
  people: UpdatePeopleDto ;

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

  @IsOptional()
  @IsString()
  supportId:string;

  @IsOptional()
    Municipio: {
    pais: {
      id: string,
      iso2: string,
      name: string,
    },
    state: {
      id: string,
      iso2: string,
      name: string,
    },
    city: {
      id: string,
      name: string
    }
  }

}
