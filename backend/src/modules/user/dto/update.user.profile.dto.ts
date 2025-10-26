import { IsOptional, IsString, Length, Matches, IsISO8601, IsUrl } from 'class-validator';
import { IsAllowedImageExtension } from 'src/shared/validators/image-extension.validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  // Validacion de caracteres para nombres: letras, numeros, espacios, acentos, puntos, comas y guiones
  @Matches(/^[A-Za-z0-9\s\u00C0-\u017F.,\-]+$/)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  @Matches(/^[A-Za-z0-9\s\u00C0-\u017F.,\-]*$/)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  @Matches(/^[A-Za-z0-9\s\u00C0-\u017F.,\-]*$/)
  residencia?: string;

  @IsOptional()
  @IsString()
  //validacion numero entre 7 y 15 caracteres, puede iniciar con +
  @Matches(/^\+?\d{7,15}$/)
  telefono?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @IsAllowedImageExtension(['jpg', 'jpeg', 'png', 'webp'])
  profilePhoto?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;

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
