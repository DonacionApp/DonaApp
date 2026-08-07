import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class FiltersNotifyDto {
    @IsOptional()
    read?: boolean;
    @IsOptional()
    search?: string;
    @IsOptional()
    type?: number;
    @IsOptional()
    minDate?: Date;
    @IsOptional()
    maxDate?: Date;
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;
}