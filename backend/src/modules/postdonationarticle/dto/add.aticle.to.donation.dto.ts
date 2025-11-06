import { IsNotEmpty, IsNumber } from "class-validator";

export class AddArticleToDonationFromPost{
    @IsNumber()
    @IsNotEmpty()
    donationId:number;
    @IsNumber()
    @IsNotEmpty()
    postArticleId:number;
    @IsNumber()
    @IsNotEmpty()
    quantity?:number;
}