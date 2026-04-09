import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServicioModule } from './servicio/servicio.module';
import { HorarioBarberoModule } from './horario-barbero/horario-barbero.module';
import { CitaModule } from './cita/cita.module';
import { ProductoModule } from './producto/producto.module';
import { CategoriaProductoModule } from './categoria-producto/categoria-producto.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { CompraProductoModule } from './compra-producto/compra-producto.module';
import { DetalleCompraModule } from './detalle-compra/detalle-compra.module';
import { CategoriaServicioModule } from './categoria-servicio/categoria-servicio.module';
import { CintaPromocionalModule } from './cinta-promocional/cinta-promocional.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { GlobalSearchModule } from './global-search/global-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true, // Solo en desarrollo
    }),

    AuthModule,
    ServicioModule,
    HorarioBarberoModule,
    CitaModule,
    ProductoModule,
    CategoriaProductoModule,
    ProveedorModule,
    CompraProductoModule,
    DetalleCompraModule,
    CategoriaServicioModule,
    CintaPromocionalModule,
    ConfiguracionModule,
    GlobalSearchModule,
  ],
})
export class AppModule { }
