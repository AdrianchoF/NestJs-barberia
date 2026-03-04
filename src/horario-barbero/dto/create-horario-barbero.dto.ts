import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { DiaSemana } from '../entities/horario-barbero.entity';
export class CreateHorarioBarberoDto {
    @IsInt({ message: 'El ID del barbero debe ser un número' })
    @IsNotEmpty({ message: 'El ID del barbero es obligatorio' })
    barberoId: number;

    @IsString({ message: 'El ID del dia debe ser un numero' })
    @IsNotEmpty({ message: 'El ID del dia es obligatorio' })
    diasemana: DiaSemana;

    @IsString({ message: 'La hora de inicio debe ser una cadena' })
    @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
    hora_inicio: string;

    @IsString({ message: 'La hora de fin debe ser una cadena' })
    @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
    hora_fin: string;
}
