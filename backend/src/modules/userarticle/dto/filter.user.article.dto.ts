import { IsOptional } from "class-validator";

export class FilterUserArticleDto {
    @IsOptional()
    cant: number;
    @IsOptional()
    needed: boolean;
    @IsOptional()
    user: number;
    @IsOptional()
    article: number;
    @IsOptional()
    search: string;
}