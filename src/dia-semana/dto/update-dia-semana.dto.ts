import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaSemanaDto } from './create-dia-semana.dto';

export class UpdateDiaSemanaDto extends PartialType(CreateDiaSemanaDto) {}
