import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaServicioDto } from './create-categoria-servicio.dto';

export class UpdateCategoriaServicioDto extends PartialType(CreateCategoriaServicioDto) {}
