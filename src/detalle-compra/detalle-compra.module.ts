import { Module } from '@nestjs/common';
import { DetalleCompraService } from './detalle-compra.service';
import { DetalleCompraController } from './detalle-compra.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleCompra } from './entities/detalle-compra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleCompra])],
  controllers: [DetalleCompraController],
  providers: [DetalleCompraService],
  exports: [TypeOrmModule, DetalleCompraService],
})
export class DetalleCompraModule {}
