import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioBarbero } from './entities/horario-barbero.entity';
import { HorarioBarberoService } from './horario-barbero.service';
import { HorarioBarberoController } from './horario-barbero.controller';
import { User } from 'src/auth/entities/user.entity';
import { Cita } from 'src/cita/entities/cita.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioBarbero, User, Cita])],
  controllers: [HorarioBarberoController],
  providers: [HorarioBarberoService],
  exports: [HorarioBarberoService]
})
export class HorarioBarberoModule { }
