import { IsEnum, IsNotEmpty, IsString, IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { DiaSemana } from '../entities/horario-barbero.entity';

export class CreateHorarioBarberoDto {
    @IsInt({ message: 'El ID del barbero debe ser un número' })
    barberoId: number;

    @IsArray({ message: 'Los dias deben enviarse como un arreglo' })
    @ArrayNotEmpty({ message: 'Debes incluir al menos un dia a la semana' })
    @IsEnum(DiaSemana, {
    each: true,
    message: 'Debe ser un día válido de la semana' 
    })
    diasSemana: DiaSemana[];

    @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
    horaInicio: string;

    @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
    horaFin: string;
}