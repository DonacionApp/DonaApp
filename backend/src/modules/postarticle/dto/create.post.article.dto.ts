import { IsNotEmpty, IsNumber } from "class-validator";

export class CreatePostArticleDto {
    @IsNotEmpty()
    @IsNumber()
    article: number;

    @IsNotEmpty()
    @IsNumber()
    post: number;
}