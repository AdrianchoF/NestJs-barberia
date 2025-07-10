import { PartialType } from '@nestjs/mapped-types';
import { CreateFranjaHorariaDto } from './create-franja-horaria.dto';

export class UpdateFranjaHorariaDto extends PartialType(CreateFranjaHorariaDto) {}
