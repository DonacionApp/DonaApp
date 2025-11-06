import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePostArticleDto {
    @IsNotEmpty()
    @IsNumber()
    article: number;

    @IsNotEmpty()
    @IsNumber()
    post: number;
    @IsNotEmpty()
    @IsString()
    quantity:string;
}