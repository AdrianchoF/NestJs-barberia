import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsDateString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateDetalleCompraDto } from '../../detalle-compra/dto/create-detalle-compra.dto';

export class CreateCompraProductoDto {

    @IsOptional()
    @IsDateString()
    fecha_compra?: string; // Fecha de la compra

    @IsNumber()
    @IsNotEmpty()
    id_proveedor: number; // Proveedor al que se le compra

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDetalleCompraDto)
    detalles: CreateDetalleCompraDto[]; // Array con los productos comprados
}
