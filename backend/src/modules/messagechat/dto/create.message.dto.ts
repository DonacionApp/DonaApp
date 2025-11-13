import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateMessageDto{
    @IsNotEmpty()
    @IsNumber()
    chatId:number;
    @IsOptional()
    @IsNumber()
    typeMessageId?:number;
    @IsOptional()
    @IsString()
    messageText?:string;
}