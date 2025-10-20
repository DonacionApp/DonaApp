import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpdateTypeDniDto{
    @IsNotEmpty({message: 'El tipo de DNI no debe estar vacío'})
    @IsString()
    type: string;
}