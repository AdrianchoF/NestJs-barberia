import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateCategoriaServicioDto {
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    nombre: string;
}