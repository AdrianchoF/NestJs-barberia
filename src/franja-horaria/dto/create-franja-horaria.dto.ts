import { IsNotEmpty, IsString, Matches } from "class-validator";
export class CreateFranjaHorariaDto {
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/,{  message: 'hora_inicio debe estar en formato HH:MM (24 horas)' })
    hora_inicio: string;

    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/,{  message: 'hora_fin debe estar en formato HH:MM (24 horas)' })
    hora_fin: string;
}