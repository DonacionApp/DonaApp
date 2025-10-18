import { IsNotEmpty, IsString } from "class-validator";
import { UserEntity } from "src/modules/user/entity/user.entity";

export class MailDto{
    @IsNotEmpty()
    @IsString()
    to:string;
    @IsNotEmpty()
    @IsString()
    subject:string;
    @IsNotEmpty()
    @IsString()
    type:string;
    context:{
        message?:string,
        title?:string,
        user:string,
        idUser:number,
        url?:string,
        code?:string,
        status?:string,
    }
}