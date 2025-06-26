import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsString()
  @Length(10, 15) // ajusta según tu necesidad
  telefono: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean
}