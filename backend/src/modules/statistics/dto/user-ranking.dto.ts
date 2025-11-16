import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class UserRankingQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @IsPositive()
  @Max(50)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @IsPositive()
  postId?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @IsPositive()
  typePostId?: number;

  @IsOptional()
  @IsString()
  typePostSlug?: string;
}

export type UserRankingItem = {
  userId: number;
  username: string;
  total: number;
};

export type UserAverageRankingItem = UserRankingItem & {
  average: number;
  reviews: number;
};

export interface UserRankingResponse {
  topAverageRating: UserAverageRankingItem[];
  topDonationsMade: UserRankingItem[];
  topDonationsReceived: UserRankingItem[];
}
