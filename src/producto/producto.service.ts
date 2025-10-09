import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async create(createProductoDto: CreateProductoDto) {
    const producto = this.productoRepository.create(createProductoDto);
    return await this.productoRepository.save(producto);
  }

  async findAll() {
    return await this.productoRepository.find({
      relations: ['categoria']
    });
  }

  async findOne(id: number) {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['categoria']
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    await this.productoRepository.update(id, updateProductoDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const producto = await this.findOne(id);
    await this.productoRepository.remove(producto);
    return `Producto con id ${id} eliminado correctamente`;
  }
}