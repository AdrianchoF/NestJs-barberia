import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioBarbero } from './entities/horario-barbero.entity';
import { HorarioBarberoService } from './horario-barbero.service';
import { HorarioBarberoController } from './horario-barbero.controller';
import { User } from 'src/auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioBarbero, User])],
  controllers: [HorarioBarberoController],
  providers: [HorarioBarberoService],
})
export class HorarioBarberoModule {}
