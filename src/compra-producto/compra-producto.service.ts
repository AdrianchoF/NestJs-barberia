import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompraProductoDto } from './dto/create-compra-producto.dto';
import { UpdateCompraProductoDto } from './dto/update-compra-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompraProducto } from './entities/compra-producto.entity';
import { DetalleCompra } from 'src/detalle-compra/entities/detalle-compra.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { Proveedor } from 'src/proveedor/entities/proveedor.entity';
import { StockHistorico } from 'src/stock-historico/entities/stock-historico.entity';

// parsers for uploaded files
// note: pdf-parse and mammoth will be imported dynamically at runtime

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

    @InjectRepository(StockHistorico)
    private readonly stockHistoricoRepository: Repository<StockHistorico>,
  ) { }

  async create(createCompraProductoDto: CreateCompraProductoDto) {
    const { id_proveedor, detalles } = createCompraProductoDto;

    // Verificar que el proveedor existe
    const proveedor = await this.proveedorRepository.findOne({ where: { id: id_proveedor } });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Crear la compra (fecha establecida en servidor)
    const compra = this.compraRepository.create({
      fecha_compra: new Date(),
      proveedor,
      total: 0, // Se actualizará después de agregar los detalles
      estado: 'pendiente',
    });
    await this.compraRepository.save(compra);

    let totalCompra = 0;

    // Crear los detalles de la compra
    for (const detalle of detalles) {
      const {
        id_producto,
        cantidad,
        precio_unitario: precioUnitario,
        codigo_producto,
      } = detalle as any;

      let producto: Producto | null = null;
      if (id_producto) {
        producto = await this.productoRepository.findOne({ where: { id: id_producto } });
      } else if (codigo_producto) {
        producto = await this.productoRepository.findOne({ where: { codigo: codigo_producto } });
      }

      // Si no hay producto, se creará cuando se marque como entregada
      const cant = Number(cantidad) || 0;
      const precioNum = precioUnitario != null ? Number(precioUnitario) : 0;
      let subtotal = cant * precioNum;

      const detalleData: any = {
        compra,
        precio_unitario: precioNum,
        total: subtotal,
        producto: producto || null,
        cantidad: cant,
        cantidad_recibida: detalle.cantidad_recibida || null,
        codigo_producto: codigo_producto || null,
        nombre_producto: detalle.nombre_producto || null,
        descripcion_producto: detalle.descripcion_producto || null,
        imagenUrl_producto: detalle.imagenUrl_producto || null,
        categoriaId_producto: detalle.categoriaId_producto || null,
      };

      const detalleCompra = this.detalleRepository.create(detalleData);
      await this.detalleRepository.save(detalleCompra);
      totalCompra += subtotal;
    }

    // actualizar el total de la compra y guardarlo
    compra.total = totalCompra;
    await this.compraRepository.save(compra);

    return compra;
  }

  // marca una compra como entregada y actualiza stocks / crea productos según código
  async marcarEntregada(id: number, fecha_entrega?: Date) {
    const compra = await this.compraRepository.findOne({
      where: { id_compra: id },
      relations: ['detalles', 'proveedor']
    });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    if (compra.estado === 'entregada') throw new Error('La compra ya está marcada como entregada');

    // Actualizar stocks con promedio ponderado de costo y registrar histórico
    // También crear productos si no existen
    for (const detalle of compra.detalles) {
      // buscar por id primero, luego por código si existe
      let producto: Producto | null = null;
      if (detalle.producto?.id) {
        producto = await this.productoRepository.findOne({ where: { id: detalle.producto.id } });
      }
      if (!producto && detalle.codigo_producto) {
        producto = await this.productoRepository.findOne({ where: { codigo: detalle.codigo_producto } });
      }

      // Si el producto no existe, ya no se crea automáticamente. 
      // La integridad depende de que el usuario lo seleccione manualmente en el frontend.
      if (!producto) {
        console.warn(`Producto no asociado en el detalle de compra. Saltando actualización de stock.`);
        continue;
      }

      const cantidadRecibida = detalle.cantidad_recibida ?? detalle.cantidad;
      const precioUnitario = detalle.precio_unitario || 0;

      // Calcular promedio ponderado o asignar precio directo si no hay stock previo
      const stockViejo = producto.stock || 0;
      const costoViejo = producto.precio_costo || 0;

      let nuevoCosto = precioUnitario;
      if (stockViejo > 0) {
        nuevoCosto = (stockViejo * costoViejo + cantidadRecibida * precioUnitario) / (stockViejo + cantidadRecibida);
      }

      // Actualizar stock y precio_costo
      producto.stock = stockViejo + cantidadRecibida;
      producto.precio_costo = nuevoCosto;
      producto.precio = nuevoCosto; // Sincronizar con el precio base del catálogo
      await this.productoRepository.save(producto);

      // Guardar histórico con precio_unitario
      const hist = this.stockHistoricoRepository.create({
        producto,
        cantidad: cantidadRecibida,
        tipo: 'entrada',
        precio_unitario: precioUnitario,
        nota: `Entrada por compra #${compra.id_compra} del proveedor ${compra.proveedor.nombre}`,
      });
      await this.stockHistoricoRepository.save(hist);
    }

    compra.estado = 'entregada';
    if (fecha_entrega) compra.fecha_entrega = fecha_entrega;
    await this.compraRepository.save(compra);

    return compra;
  }

  async findAll() {
    const compras = await this.compraRepository.find({ relations: ['proveedor', 'detalles', 'detalles.producto'] });
    // convert any decimal strings to numbers
    return compras.map(c => ({
      ...c,
      total: c.total != null ? Number(c.total) : 0,
    }));
  }

  async findOne(id: number) {
    const compra = await this.compraRepository.findOne({ where: { id_compra: id }, relations: ['proveedor', 'detalles', 'detalles.producto'] });
    if (compra && compra.total != null) {
      compra.total = Number(compra.total);
    }
    return compra;
  }

  update(id: number, updateCompraProductoDto: UpdateCompraProductoDto) {
    return `This action updates a #${id} compraProducto`;
  }

  async remove(id: number) {
    const compra = await this.compraRepository.findOne({
      where: { id_compra: id },
      relations: ['detalles']
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    if (compra.estado !== 'pendiente') {
      throw new Error('Solo se pueden eliminar compras en estado pendiente');
    }

    // La eliminación de detalles es automática por cascade: true en la entidad
    return await this.compraRepository.remove(compra);
  }

  // Add parsed detalles to an existing compra (will keep producto null if no id provided)
  async addDetalles(id: number, detalles: any[]) {
    const compra = await this.compraRepository.findOne({ where: { id_compra: id } });
    if (!compra) throw new NotFoundException('Compra no encontrada');

    const creados: DetalleCompra[] = [];

    for (const d of detalles) {
      let producto: Producto | null = null;
      const codigo = d.codigo_producto || null;
      if (d.id_producto) {
        producto = await this.productoRepository.findOne({ where: { id: d.id_producto } });
      }
      if (!producto && codigo) {
        producto = await this.productoRepository.findOne({ where: { codigo } });
      }

      // Convert incoming values to numbers to avoid string math later
      const cantidad = Number(d.cantidad) || 1;
      const precio = d.precio_unitario != null ? Number(d.precio_unitario) : null;
      const subtotal = precio ? cantidad * precio : 0;

      const detalleData: any = {
        compra,
        precio_unitario: precio,
        total: subtotal,
        producto: producto || null,
        cantidad,
        cantidad_recibida: d.cantidad_recibida ?? null,
        codigo_producto: codigo,
        nombre_producto: d.nombre_producto || null,
        descripcion_producto: d.descripcion_producto || null,
        imagenUrl_producto: d.imagenUrl_producto || null,
        categoriaId_producto: d.categoriaId_producto || null,
      };

      const nuevo = this.detalleRepository.create(detalleData);
      const saved = (await this.detalleRepository.save(nuevo)) as unknown as DetalleCompra;
      creados.push(saved);
    }

    // Recalcular total from all detalles, coercing string decimals to numbers
    const detallesAll = await this.detalleRepository.find({ where: { compra: { id_compra: id } } });
    let total = 0;
    for (const det of detallesAll) {
      const t = det.total != null ? Number(det.total) : 0;
      total += t;
    }
    compra.total = total;
    await this.compraRepository.save(compra);

    return { creados, compra };
  }
}
