import { IsNotEmpty, IsNumber } from "class-validator"

export class UpdateQuantityDto {
    @IsNotEmpty()
    @IsNumber()
    userArticleId: number
    @IsNotEmpty()
    @IsNumber()
    cant: number
}