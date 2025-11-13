import { IsNotEmpty, IsOptional } from "class-validator";

export class AddChatToUserDto{
    @IsNotEmpty()
    chatId:number;
    @IsNotEmpty()
    userId:number;
    @IsOptional()
    donator?:boolean;
    @IsOptional()
    admin?:boolean;
}