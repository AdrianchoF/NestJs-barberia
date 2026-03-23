import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { User } from '../auth/entities/user.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Producto } from '../producto/entities/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Servicio, Producto]),
  ],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
})
export class GlobalSearchModule { }
