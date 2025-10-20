import { IsNotEmpty, IsNumber, isNumber, IsString } from "class-validator";

export class CreatePeopleDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    birdthDate: Date;

    @IsNotEmpty()
    @IsNumber()
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

    @IsNotEmpty()
    @IsString()
    supportId: string;
}