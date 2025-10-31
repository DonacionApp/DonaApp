import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateNotifyDto {
   @IsNotEmpty()
   @IsString()
   message: string;

   @IsNotEmpty()
   @IsInt()
   @Min(1)
   typeNotifyId: number;

   @IsOptional()
   @IsArray()
   @ArrayNotEmpty()
   @ArrayUnique()
   recipientIds?: number[];
}