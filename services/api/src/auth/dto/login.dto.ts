import { IsOptional, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  grant_type: string;

  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  otp?: string;
}
