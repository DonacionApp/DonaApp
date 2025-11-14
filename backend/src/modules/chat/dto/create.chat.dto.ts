import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateChatDto{
    @IsOptional()
    @IsString()
    chatName?:string;
    @IsNotEmpty()
    @IsNumber()
    chatStatusId:number;
    @IsOptional()
    @IsNumber()
    donationId?:number;
    @IsNotEmpty()
    participantIds:[
        {userId:number, isDonator?:boolean, isAdmin?:boolean}
    ];
}