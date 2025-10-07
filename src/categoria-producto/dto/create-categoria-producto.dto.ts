import { IsString, Length } from "class-validator";

export class CreateCategoriaProductoDto {
    @IsString()
    @Length(2, 100)
    nombre: string;
}