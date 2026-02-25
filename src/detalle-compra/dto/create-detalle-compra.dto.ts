import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDetalleCompraDto {
    @IsOptional()
    @IsNumber()
    id_producto?: number;

    @IsNotEmpty()
    @IsNumber()
    cantidad: number;

    @IsOptional()
    @IsNumber()
    cantidad_recibida?: number;

    @IsNumber()
    @IsNotEmpty()
    precio_unitario: number;

    // Campos opcionales para crear producto automáticamente si no existe
    @IsOptional()
    @IsString()
    nombre_producto?: string;

    @IsOptional()
    @IsString()
    codigo_producto?: string;

    @IsOptional()
    @IsString()
    descripcion_producto?: string;

    @IsOptional()
    @IsString()
    imagenUrl_producto?: string;

    @IsOptional()
    @IsNumber()
    categoriaId_producto?: number;
}
