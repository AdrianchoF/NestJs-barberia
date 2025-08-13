import { IsString, IsNotEmpty, IsNumber, Min, MaxLength, Matches } from 'class-validator';

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
    @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
        message: 'duracionAprox must be in the format HH:mm:ss',
    })
    duracionAprox: string;
}
