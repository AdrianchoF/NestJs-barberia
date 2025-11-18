import { Injectable } from '@nestjs/common';
import { CreateCategoriaServicioDto } from './dto/create-categoria-servicio.dto';
import { UpdateCategoriaServicioDto } from './dto/update-categoria-servicio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaServicio } from './entities/categoria-servicio.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriaServicioService {
  constructor(
    @InjectRepository(CategoriaServicio)
    private readonly categoriaServicioRepository: Repository<CategoriaServicio>,
  ) {}

  async create(createCategoriaServicioDto: CreateCategoriaServicioDto) {
    const categoriaServicio = this.categoriaServicioRepository.create(createCategoriaServicioDto);
    return await this.categoriaServicioRepository.save(categoriaServicio);
  }

  async findAll() {
    return await this.categoriaServicioRepository.find({ relations: ['servicios'] });
  }

  async findOne(id: number) {
    const categoriaServicio = await this.categoriaServicioRepository.findOne({ where: { id }, relations: ['servicios'] });
    if (!categoriaServicio) {
      throw new Error(`Categoria con ID ${id} no encontrada`);
    }
    return categoriaServicio;
  }

  async update(id: number, updateCategoriaServicioDto: UpdateCategoriaServicioDto) {
    const categoriaServicio = await this.findOne(id);
    Object.assign(categoriaServicio, updateCategoriaServicioDto);
    return this.categoriaServicioRepository.save(categoriaServicio);
  }

  async remove(id: number) {
    const categoriaServicio = await this.findOne(id);
    return this.categoriaServicioRepository.remove(categoriaServicio);
  }
}
