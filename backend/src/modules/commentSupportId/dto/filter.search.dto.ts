import { IsNumber, IsOptional, IsString } from "class-validator";

export class FilterSearchCommentSupportIdDto {
    @IsOptional()
    @IsNumber()
    idStatusSupportId?: number;
    @IsOptional()
    @IsNumber()
    idUser?: number;
    @IsOptional()
    @IsString()
    search?:string;
    @IsOptional()
    @IsString()
    sortBy?: 'comment' | 'id' | 'createdAt';
    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC';
}