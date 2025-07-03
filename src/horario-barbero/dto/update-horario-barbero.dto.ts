import { PartialType } from '@nestjs/mapped-types';
import { CreateHorarioBarberoDto } from './create-horario-barbero.dto';

export class UpdateHorarioBarberoDto extends PartialType(CreateHorarioBarberoDto) {}
