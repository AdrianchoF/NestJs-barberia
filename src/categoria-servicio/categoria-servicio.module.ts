import { Module } from '@nestjs/common';
import { CategoriaServicioService } from './categoria-servicio.service';
import { CategoriaServicioController } from './categoria-servicio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaServicio } from './entities/categoria-servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaServicio])],
  controllers: [CategoriaServicioController],
  providers: [CategoriaServicioService],
  exports: [CategoriaServicioService],
})
export class CategoriaServicioModule {}
