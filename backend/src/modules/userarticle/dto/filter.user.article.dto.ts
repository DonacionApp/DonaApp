import { IsOptional } from "class-validator";

export class FilterUserArticleDto {
    @IsOptional()
    needed: boolean;
    @IsOptional()
    article: number;
    @IsOptional()
    search: string;
}