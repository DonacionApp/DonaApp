import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class createCommentSupportIdDto{
    @IsString()
    @IsNotEmpty()
    comment:string;
    @IsNotEmpty()
    @IsNumber()
    idStatusSupportId:number;
    @IsNotEmpty()
    @IsNumber()
    idUser:number;
}