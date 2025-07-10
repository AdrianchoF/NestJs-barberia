import { IsString } from "class-validator";

export class CreateDiaSemanaDto {
    @IsString()
    nombre_dia: string;
}