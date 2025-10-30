import { IsOptional, IsString } from "class-validator";

export class PostFilterDto{
    @IsOptional()
    @IsString()
    userName:string;
    @IsOptional()
    @IsString()
    search?:string;
    @IsOptional()
    @IsString()
    orderBy?:'createdAt' | 'updatedAt' | 'title' | 'likesCount';
    @IsOptional()
    @IsString()
    orderDirection?:'ASC' | 'DESC';
    @IsOptional()
    @IsString()
    tags?:string[];
    @IsOptional()
    @IsString()
    typePost?:number;

}