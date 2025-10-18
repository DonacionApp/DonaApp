import { IsNotEmpty, IsString } from "class-validator";

export class  CreatetypeDniDto {
    @IsNotEmpty()
    @IsString()
    type: string;
}