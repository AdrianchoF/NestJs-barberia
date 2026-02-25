import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';
import { IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
    @IsOptional()
    @IsBoolean()
    publicado?: boolean;

    @IsOptional()
    @IsNumber()
    precio_venta?: number;
}
