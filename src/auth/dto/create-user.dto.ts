import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsDateString, IsBoolean } from 'class-validator';

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

    @IsOptional()
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @Length(10, 20, { message: 'El teléfono debe tener entre 10 y 20 caracteres' })
    telefono?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha debe tener formato válido (YYYY-MM-DD)' })
    fechaNacimiento?: string;

    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
    activo?: boolean;
}