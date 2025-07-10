import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
//import { UpdateFranjaHorariaDto } from './dto/update-franja-horaria.dto';

@Injectable()
export class FranjaHorariaService {

  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepo: Repository<FranjaHoraria>
  ) {}

  async create(dto: CreateFranjaHorariaDto) {
    return await this.franjaRepo.save(dto);
  }

  findAll() {
    return this.franjaRepo.find();
  }

  findOne(id: number) {
    return this.franjaRepo.findOneBy({ id_franja: id });
  }

  /* update(id: number, updateFranjaHorariaDto: UpdateFranjaHorariaDto) {
    return `This action updates a #${id} franjaHoraria`;
  } */

  remove(id: number) {
    return this.franjaRepo.delete(id);
  }
}
