import { IsString } from 'class-validator';

export class DeleteRangeDto {
  @IsString()
  minDate: string;

  @IsString()
  maxDate: string;
}
