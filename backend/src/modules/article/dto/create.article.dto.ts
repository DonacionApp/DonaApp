import { IsNotEmpty, IsString } from "class-validator";

export class CreateArticleDto{
    @IsNotEmpty()
    @IsString()
    name:string;
}