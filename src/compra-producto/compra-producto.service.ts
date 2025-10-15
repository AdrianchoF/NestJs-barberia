import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompraProductoDto } from './dto/create-compra-producto.dto';
import { UpdateCompraProductoDto } from './dto/update-compra-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompraProducto } from './entities/compra-producto.entity';
import { DetalleCompra } from 'src/detalle-compra/entities/detalle-compra.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';

@Injectable()
export class CompraProductoService {
  constructor(
    @InjectRepository(CompraProducto)
    private readonly compraRepository: Repository<CompraProducto>,

    @InjectRepository(DetalleCompra)
    private readonly detalleRepository: Repository<DetalleCompra>,

    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async create(createCompraProductoDto: CreateCompraProductoDto) {
    const { fecha_compra, id_proveedor, detalles } = createCompraProductoDto;

    // Verificar que el proveedor existe
    const proveedor = await this.proveedorRepository.findOne({ where: { id: id_proveedor } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Crear la compra
    const compra = this.compraRepository.create({
      fecha_compra,
      proveedor,
      total: 0, // Se actualizará después de agregar los detalles
    });
    await this.compraRepository.save(compra);

    let totalCompra = 0;

    // Crear los detalles de la compra
    for (const detalle of detalles) {
      const { id_producto, cantidad } = detalle;

      // Verificar que el producto existe
      const producto = await this.productoRepository.findOne({ where: { id: id_producto } });
      if (!producto) {
        throw new Error(`Producto con ID ${id_producto} no encontrado`);
      }

      const subtotal = cantidad * producto.precio;
      totalCompra += subtotal;

      const detalleData = {
        compra,
        precio_unitario: producto.precio,
        subtotal,
        producto,
        cantidad,
      } as any;

      const detalleCompra = this.detalleRepository.create(detalleData);
      await this.detalleRepository.save(detalleCompra);
    }

    // actualizar el total de la compra y guardarlo
    compra.total = totalCompra;
    await this.compraRepository.save(compra);

    return compra;
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
