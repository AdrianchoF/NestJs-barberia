import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export enum TipoPausa {
    RECURRENTE = 'recurrente',
    OCASIONAL = 'ocasional'
}

export class CreatePausaDto {
    @IsEnum(TipoPausa)
    tipo: TipoPausa;

    @IsOptional()
    @IsDateString()
    fecha?: string; // Solo para ocasional

    @IsString()
    hora_inicio: string;

    @IsString()
    hora_fin: string;

    @IsString()
    motivo: string;

    @IsOptional()
    @IsBoolean()
    todos_los_dias?: boolean; // Solo para recurrente
}

export class UpdatePausaDto extends CreatePausaDto {
    @IsString()
    id: string;
}