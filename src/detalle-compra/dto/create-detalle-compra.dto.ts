import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDetalleCompraDto {
    @IsNumber()
    @IsNotEmpty()
    id_producto: number;

    @IsNumber()
    @IsNotEmpty()
    cantidad: number;

    @IsNumber()
    @IsNotEmpty()
    precio_unitario: number;
}
