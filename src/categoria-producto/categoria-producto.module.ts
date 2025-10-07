import { Module } from '@nestjs/common';
import { CategoriaProductoService } from './categoria-producto.service';
import { CategoriaProductoController } from './categoria-producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaProducto } from './entities/categoria-producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaProducto])],
  controllers: [CategoriaProductoController],
  providers: [CategoriaProductoService],
  exports: [CategoriaProductoService],
})
export class CategoriaProductoModule {}
