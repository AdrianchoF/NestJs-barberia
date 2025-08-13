import { IsDateString, IsInt, IsNotEmpty, IsString } from "class-validator";
export class CreateCitaDto {
    @IsNotEmpty()
    @IsInt()
    clienteId: number;

    @IsNotEmpty()
    @IsInt()
    barberoId: number;

    @IsNotEmpty()
    @IsInt()
    servicioId: number;

    @IsNotEmpty()
    @IsString()
    hora: string;

    @IsNotEmpty()
    @IsDateString()
    fecha: Date;
}