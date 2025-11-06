import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateArticleDto{
    @IsNotEmpty()
    @IsString()
    name:string;
    @IsOptional()
    @IsString()
    description:string;
}