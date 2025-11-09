import { IsOptional } from "class-validator";

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
}