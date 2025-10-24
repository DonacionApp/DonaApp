import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreatePeopleDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsNotEmpty()
    birdthDate: Date;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    tipodDni: number;

    @IsNotEmpty()
    @IsString()
    dni: string;

    @IsNotEmpty()
    @IsString()
    residencia: string;

    @IsNotEmpty()
    @IsString()
    telefono: string;

    @IsOptional()
    @IsString()
    supportId?: string;
}