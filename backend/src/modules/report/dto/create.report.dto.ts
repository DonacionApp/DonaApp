import { IsNotEmpty } from "class-validator";

export class CreateReportDto{
    @IsNotEmpty()
    idUser:number;
    @IsNotEmpty()
    content:{
        report:string,
        extraCommets?:string,
        postReport?:number;
    }
}