import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaSemana } from './entities/dia-semana.entity';
import { CreateDiaSemanaDto } from './dto/create-dia-semana.dto';

@Injectable()
export class DiaSemanaService {
  constructor(
    @InjectRepository(DiaSemana)
    private readonly diaSemanaRepository: Repository<DiaSemana>,
  ) {}

  async create(createDiaSemanaDto: CreateDiaSemanaDto) {
    const { nombre_dia } = createDiaSemanaDto;

    const existingDia = await this.diaSemanaRepository.findOne({ where: { nombre_dia } });
    if (existingDia) {
      throw new BadRequestException('El día ya existe');
    }

    const dia = this.diaSemanaRepository.create({ nombre_dia });
    return await this.diaSemanaRepository.save(dia);
  }

  async findAll() {
    return await this.diaSemanaRepository.find({ order: { id_dia: 'ASC' } });
  }

  async findOne(id: number) {
    const dia = await this.diaSemanaRepository.findOne({ where: { id_dia: id } });
    if (!dia) {
      throw new BadRequestException(`Día con ID ${id} no encontrado`);
    }
    return dia;
  }

  async remove(id: number) {
    const dia = await this.findOne(id);
    await this.diaSemanaRepository.remove(dia);
    return { message: `Día con ID ${id} eliminado correctamente` };
  }
}