import { Module } from '@nestjs/common';
import { CompraProductoService } from './compra-producto.service';
import { CompraProductoController } from './compra-producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraProducto } from './entities/compra-producto.entity';
import { DetalleCompra } from 'src/detalle-compra/entities/detalle-compra.entity';
import { ProductoModule } from 'src/producto/producto.module';
import { ProveedorModule } from 'src/proveedor/proveedor.module';

@Module({
  imports: [TypeOrmModule.forFeature([CompraProducto, DetalleCompra]),
    ProductoModule,
    ProveedorModule,
  ],
  controllers: [CompraProductoController],
  providers: [CompraProductoService],
  exports: [TypeOrmModule, CompraProductoService],
})
export class CompraProductoModule {}
