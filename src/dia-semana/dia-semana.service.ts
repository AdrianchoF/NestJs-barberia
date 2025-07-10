import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaSemana } from './entities/dia-semana.entity';
import { CreateDiaSemanaDto } from './dto/create-dia-semana.dto';
//import { UpdateDiaSemanaDto } from './dto/update-dia-semana.dto';

@Injectable()
export class DiaSemanaService {

  constructor(
    @InjectRepository(DiaSemana)
    private readonly diaRepo: Repository<DiaSemana>
  ){}

  async create(dto: CreateDiaSemanaDto) {
    return await this.diaRepo.save(dto);
  }

  findAll() {
    return this.diaRepo.find();
  }

  findOne(id: number) {
    return this.diaRepo.findOneBy({ id_dia: id });
  }

  /* update(id: number, updateDiaSemanaDto: UpdateDiaSemanaDto) {
    return `This action updates a #${id} diaSemana`;
  } */

  remove(id: number) {
    return this.diaRepo.delete(id);
  }
}
