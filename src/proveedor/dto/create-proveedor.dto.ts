import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateProveedorDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    direccion: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(15)
    telefono: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    email: string;
}