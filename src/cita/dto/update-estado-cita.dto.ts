import { IsEnum } from 'class-validator';
import { EstadoCita } from '../entities/cita.entity';

export class UpdateEstadoCitaDto {
    @IsEnum(EstadoCita)
    estado: EstadoCita;
}