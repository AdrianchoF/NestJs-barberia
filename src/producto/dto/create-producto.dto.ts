import { IsNotEmpty, IsNumber, IsString, MaxLength, IsOptional, IsBoolean, IsArray } from "class-validator";

export class CreateProductoDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    codigo?: string;

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
    @MaxLength(500)
    imagenUrl: string;

    @IsNotEmpty()
    @IsNumber()
    categoriaId: number;

    @IsOptional()
    @IsNumber()
    precio_costo?: number;

    @IsOptional()
    @IsNumber()
    stock_minimo?: number;

    @IsOptional()
    @IsBoolean()
    publicado?: boolean;

    @IsOptional()
    @IsNumber()
    precio_venta?: number;

    @IsOptional()
    @IsString()
    descripcionPublica?: string;

    @IsOptional()
    @IsString()
    ingredientes?: string;

    @IsOptional()
    @IsString()
    modo_uso?: string;

    @IsOptional()
    @IsString()
    cantidades?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    beneficios?: string[];
}