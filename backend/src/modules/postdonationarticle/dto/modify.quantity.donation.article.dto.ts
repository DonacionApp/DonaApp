import { IsNotEmpty, IsNumber, isNumber } from "class-validator";

export class ModifyQuantityPostdonationarticleService {
    @IsNotEmpty()
    @IsNumber()
    postDonationArticleId: number;
    @IsNotEmpty()
    @IsNumber()
    newQuantity: number;
}