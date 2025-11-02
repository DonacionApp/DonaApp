import { ArrayNotEmpty, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateNotifyDto {
   @IsNotEmpty()
   @IsString()
   message: string;

   @IsNotEmpty()
   @IsInt()
   @Min(1)
   typeNotifyId: number;

   @IsArray()
   @ArrayNotEmpty()
   @ArrayUnique()
   @IsInt({ each: true })
   @Min(1, { each: true })
   usersIds: number[];
}