import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto{
    @IsNotEmpty()
    @IsString()
    email:string;

    @IsNotEmpty()
    @IsString()
    code:string;
}