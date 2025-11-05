import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateNotifyDto {

   @IsOptional()
   @IsString()
   @IsNotEmpty()
   title?: string;
   @IsOptional()
   @IsString()
   @IsNotEmpty()
   message?: string;

   @IsOptional()
   @IsNumber()
   @IsInt()
   @Min(1)
   typeNotifyId?: number;
}