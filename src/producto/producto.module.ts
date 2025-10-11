import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { Producto } from './entities/producto.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [TypeOrmModule, ProductoService],
})
export class ProductoModule {}
