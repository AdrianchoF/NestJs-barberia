import { Injectable } from '@nestjs/common';
import { CreateCompraProductoDto } from './dto/create-compra-producto.dto';
import { UpdateCompraProductoDto } from './dto/update-compra-producto.dto';

@Injectable()
export class CompraProductoService {
  create(createCompraProductoDto: CreateCompraProductoDto) {
    return 'This action adds a new compraProducto';
  }

  findAll() {
    return `This action returns all compraProducto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} compraProducto`;
  }

  update(id: number, updateCompraProductoDto: UpdateCompraProductoDto) {
    return `This action updates a #${id} compraProducto`;
  }

  remove(id: number) {
    return `This action removes a #${id} compraProducto`;
  }
}
