import { IsOptional, IsString } from "class-validator";

export class UpdatePoliciesDto {
    @IsOptional()
    @IsString()
    content: string;
}