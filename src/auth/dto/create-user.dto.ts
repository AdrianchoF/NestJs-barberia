import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Role } from '../entities/user.entity';

export class CreateUserDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
    nombre: string;

    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    @Length(2, 100, { message: 'El apellido debe tener entre 2 y 100 caracteres' })
    apellido: string;

    @IsNotEmpty({ message: 'El email es obligatorio' })
    @IsEmail({}, { message: 'Debe ser un email válido' })
    email: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @Length(6, 100, { message: 'La contraseña debe tener entre 6 y 100 caracteres' })
    password: string;

    @IsOptional()
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @Length(10, 20, { message: 'El teléfono debe tener entre 10 y 20 caracteres' })
    telefono?: string;

    @IsOptional()
    @IsEnum(Role, { message: 'El rol debe ser CLIENTE, BARBERO o ADMINISTRADOR' })
    role: Role;

    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
    activo?: boolean;
}