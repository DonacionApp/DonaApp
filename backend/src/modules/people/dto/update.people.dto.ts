import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpdatePeopleDto {
    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsNotEmpty()
    @IsString()
    lastName: string;
    
    @IsNotEmpty()
    @IsString()
    birdthDate: Date;
    
    @IsNotEmpty() 
    @IsNumber()      
    tipodDni: number;
    
    @IsNotEmpty()
    @IsString()
    dni: string;
    
    @IsNotEmpty()               
    @IsString()
    residencia: string;
    
    @IsNotEmpty()
    @IsString()
    telefono: string;
    
    @IsNotEmpty()
    @IsString()
    supportId: string;
}