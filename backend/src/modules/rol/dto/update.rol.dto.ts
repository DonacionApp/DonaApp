import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRolDto {
  @IsNotEmpty()
  @IsString()
  rol: string;
}
