import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateUserArticleDto {
    @IsNotEmpty()
    @IsNumber()
    cant: number;
    @IsNotEmpty()
    needed: boolean;
    @IsNotEmpty()
    user: number;
    @IsNotEmpty()
    article: number;
}