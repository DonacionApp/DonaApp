import { IsOptional } from "class-validator";

export class FilterSearchPostDonationArticleDto{
    @IsOptional()
    donationId?:number;
    @IsOptional()
    postId?:number;
    @IsOptional()
    postArticleId?:number;
    @IsOptional()
    search?:string;
}