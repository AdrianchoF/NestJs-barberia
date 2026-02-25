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
  ) {}

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

      // Si el producto no existe, crearlo automáticamente
      if (!producto && detalle.nombre_producto) {
        producto = this.productoRepository.create({
          nombre: detalle.nombre_producto,
          descripcion: detalle.descripcion_producto || '',
          precio: detalle.precio_unitario || 0,
          stock: 0,
          precio_costo: detalle.precio_unitario || 0,
          stock_minimo: 0,
          codigo: detalle.codigo_producto || undefined,
        });
        await this.productoRepository.save(producto);
        console.log(`Producto creado automáticamente: ${producto.nombre}`);
      }

      if (!producto) continue; // Si aún no hay producto, saltar

      const cantidadRecibida = detalle.cantidad_recibida ?? detalle.cantidad;
      const precioUnitario = detalle.precio_unitario || 0;

      // Calcular promedio ponderado
      const stockViejo = producto.stock || 0;
      const costoViejo = producto.precio_costo || 0;

      let nuevoCosto = costoViejo;
      if (stockViejo + cantidadRecibida > 0) {
        nuevoCosto =
          (stockViejo * costoViejo + cantidadRecibida * precioUnitario) / (stockViejo + cantidadRecibida);
      }

      // Actualizar stock y precio_costo
      producto.stock = stockViejo + cantidadRecibida;
      producto.precio_costo = nuevoCosto;
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

  remove(id: number) {
    return `This action removes a #${id} compraProducto`;
  }

  // Heuristic parser for pasted confirmation text (MVP)
  async parseConfirmationText(id: number, text: string) {
    if (!text) return [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsed: any[] = [];

    for (let line of lines) {
      // try to extract a product code if user included "cod" or "codigo" or as first token
      let codigo: string | null = null;
      const codeMatch = line.match(/(?:cod(?:igo)?\s*[:\-]?\s*([A-Za-z0-9\-]+))/i);
      if (codeMatch) {
        codigo = codeMatch[1];
        line = line.replace(codeMatch[0], '');
      }
      // fallback: first token alphanumeric with letters
      if (!codigo) {
        const tokens = line.split(/\s+/);
        if (tokens.length > 0 && /^[A-Za-z0-9\-]+$/.test(tokens[0]) && !/^\d+$/.test(tokens[0])) {
          codigo = tokens[0];
          tokens.shift();
          line = tokens.join(' ');
        }
      }

      // Find numbers (integer or decimal)
      const numberMatches = (line.match(/[\d]+(?:[.,]\d+)?/g) ?? []) as string[];

      let cantidad = 1;
      let precio: number | null = null;

      if (numberMatches.length >= 2) {
        // assume first is qty, last is price
        const first = (numberMatches[0] || '').replace(',', '.');
        const last = (numberMatches[numberMatches.length - 1] || '').replace(',', '.');
        cantidad = Math.round(Number(first)) || 1;
        precio = Number(last) || null;
      } else if (numberMatches.length === 1) {
        const single = (numberMatches[0] || '').replace(',', '.');
        // if contains decimal, likely price
        if (single.indexOf('.') !== -1) {
          precio = Number(single) || null;
          cantidad = 1;
        } else {
          cantidad = Math.round(Number(single)) || 1;
        }
      }

      // Build name by removing numbers, x, currency symbols and common separators
      let nombre = line.replace(/[\d]+(?:[.,]\d+)?/g, '');
      nombre = nombre.replace(/x|X|\*|-/g, ' ');
      nombre = nombre.replace(/\$|€|₡|₽|£/g, '');
      nombre = nombre.replace(/[\s]{2,}/g, ' ').trim();
      if (!nombre) nombre = 'Producto';

      parsed.push({
        codigo_producto: codigo,
        nombre_producto: nombre,
        cantidad,
        precio_unitario: precio,
        subtotal: precio ? cantidad * precio : null,
      });
    }

    return parsed;
  }

  // parse uploaded confirmation file (pdf, docx, txt, etc.)
  // file is typed as any to avoid Multer/Express type mismatches across environments
  async parseConfirmationFile(id: number, file: any) {
    if (!file || !file.buffer) return [];
    let text = '';

    const mime = file.mimetype || '';
    try {
      if (mime === 'application/pdf') {
        try {
          const pdfParseModule: any = await import('pdf-parse');
          const data: any = await pdfParseModule.default(file.buffer);
          text = data?.text || '';
        } catch (e) {
          console.warn('pdf-parse not available or failed:', e);
        }
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword'
      ) {
        try {
          const mammothModule: any = await import('mammoth');
          const res = await mammothModule.extractRawText({ buffer: file.buffer });
          text = res?.value || '';
        } catch (e) {
          console.warn('mammoth not available or failed:', e);
        }
      } else if (mime.startsWith('text/')) {
        text = file.buffer.toString('utf8');
      } else {
        // Fallback: try to treat as utf8 text
        text = file.buffer.toString('utf8');
      }
    } catch (err) {
      console.warn('Error parsing file:', err);
      text = '';
    }

    return this.parseConfirmationText(id, text);
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
