import { IsOptional } from "class-validator";

export class FiltersDtoArticles{
    @IsOptional()
    name?:string;
    @IsOptional()
    descripcion:string;
    @IsOptional()
    orderBy?: 'ASC' | 'DESC';
}