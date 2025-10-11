import { Injectable } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,
  ) {}

  create(createProveedorDto: CreateProveedorDto) {
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return this.proveedorRepository.save(proveedor);
  }

  findAll() {
    return this.proveedorRepository.find();
  }

  findOne(id: number) {
    return this.proveedorRepository.findOneBy({ id });
  }

  update(id: number, updateProveedorDto: UpdateProveedorDto) {
    return this.proveedorRepository.update(id, updateProveedorDto);
  }

  remove(id: number) {
    this.proveedorRepository.delete(id);
    return `Proveedor con ID ${id} eliminado correctamente`;
  }
}
