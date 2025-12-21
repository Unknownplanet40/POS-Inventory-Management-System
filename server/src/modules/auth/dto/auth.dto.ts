import { IsString, IsEnum, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['admin', 'cashier'])
  role: 'admin' | 'cashier';
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
