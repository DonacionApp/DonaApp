import { IsOptional } from "class-validator";

export class FiltersDtoArticles{
    @IsOptional()
    name?:string;
    @IsOptional()
    orderBy?: 'ASC' | 'DESC';
}