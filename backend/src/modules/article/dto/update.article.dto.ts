import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateArticleDto{
    @IsOptional()
    @IsString()
    name:string;
    @IsOptional()
    @IsString()
    description:string;
}