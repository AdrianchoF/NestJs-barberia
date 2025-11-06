import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EstadoCita } from "../entities/cita.entity";
export class CreateCitaDto {
    @IsNotEmpty()
    @IsInt()
    clienteId: number;

    @IsNotEmpty()
    @IsInt()
    barberoId: number;

    @IsNotEmpty()
    @IsArray()
    @IsInt({ each: true })
    servicioId: number[];

    @IsNotEmpty()
    @IsString()
    hora: string;

    @IsNotEmpty()
    @IsDateString()
    fecha: Date;

    @IsOptional()
    @IsString()
    estado: EstadoCita;
}