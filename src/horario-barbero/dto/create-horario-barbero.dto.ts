import { IsEnum, IsNotEmpty, IsString, IsInt, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateHorarioBarberoDto {
    @IsInt({ message: 'El ID del barbero debe ser un número' })
    @IsNotEmpty({ message: 'El ID del barbero es obligatorio' })
    barberoId: number;

    @IsInt({ message: 'El ID del dia debe ser un numero' })
    @IsNotEmpty({ message: 'El ID del dia es obligatorio' })
    idDia: number;

    @IsInt({ message: 'El ID de la franja horaria debe ser un numero' })
    @IsNotEmpty({ message: 'El ID de la franja horaria es obligatorio' })
    idFranja: number;
}