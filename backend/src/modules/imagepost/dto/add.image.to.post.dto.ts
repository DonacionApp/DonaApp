import { IsNotEmpty, IsString } from "class-validator";


export class AddImageToPostDto {
    @IsNotEmpty()
    postId:number;
    @IsNotEmpty()
    @IsString()
    imageUrl:string;
}