import { IsString, IsNotEmpty, IsNumber, Min, MaxLength } from 'class-validator';

export class CreateServicioDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @IsNumber()
    @Min(0)
    precio: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    duracionAprox: string;
}
