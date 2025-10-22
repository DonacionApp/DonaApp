import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto{
    @IsNotEmpty()
    @IsString()
    token:string;
    @IsNotEmpty()
    @IsString()
    newPassword:string;
}