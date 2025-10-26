import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePeopleDto {
    @IsOptional()
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsOptional()
    birdthDate: Date;

    @IsOptional()
    @IsNumber()
    tipodDni: number;

    @IsOptional()
    @IsString()
    dni: string;

    @IsOptional()
    @IsString()
    residencia: string;

    @IsOptional()
    @IsString()
    telefono: string;

    @IsOptional()
    @IsString()
    supportId: string;

    @IsOptional()
    municipio: {
        pais: {
            iso2: string,
        },
        state: {
            iso2: string,
        },
        city: {
            name: string
        }
    }
}