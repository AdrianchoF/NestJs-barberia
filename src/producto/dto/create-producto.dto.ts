import { IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";

export class CreateProductoDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    nombre: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    descripcion: string;

    @IsNotEmpty()
    @IsNumber()
    precio: number;

    @IsNotEmpty()
    @IsNumber()
    stock: number;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    categoria: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    imagenUrl: string;
}