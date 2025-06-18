import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginAuthDto {
    @IsEmail({}, { message: 'El email no es válido' })
    email: string;

    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string;
}
