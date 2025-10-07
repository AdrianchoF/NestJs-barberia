import { Injectable } from '@nestjs/common';
import { CreateCategoriaProductoDto } from './dto/create-categoria-producto.dto';
import { UpdateCategoriaProductoDto } from './dto/update-categoria-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriaProductoService {
  constructor(
    @InjectRepository(CategoriaProducto)
    private readonly categoriaProductoRepository: Repository<CategoriaProducto>,
  ) {}

  async create(createCategoriaProductoDto: CreateCategoriaProductoDto) {
    const categoriaProducto = this.categoriaProductoRepository.create(createCategoriaProductoDto);
    return this.categoriaProductoRepository.save(categoriaProducto);
  }

  async findAll() {
    return this.categoriaProductoRepository.find({ relations: ['productos'] });
  }

  async findOne(id: number) {
    const categoriaProducto = await this.categoriaProductoRepository.findOne({ where: { id }, relations: ['productos'] });
    if (!categoriaProducto) {
      throw new Error(`Categoria con ID ${id} no encontrada`);
    }
    return categoriaProducto;
  }

  async update(id: number, updateCategoriaProductoDto: UpdateCategoriaProductoDto) {
    const categoriaProducto = await this.findOne(id);
    Object.assign(categoriaProducto, updateCategoriaProductoDto);
    return this.categoriaProductoRepository.save(categoriaProducto);
  }

  async remove(id: number) {
    const categoriaProducto = await this.findOne(id);
    return this.categoriaProductoRepository.remove(categoriaProducto);
  }
}