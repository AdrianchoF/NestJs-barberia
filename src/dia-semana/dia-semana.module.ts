import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaSemanaService } from './dia-semana.service';
import { DiaSemanaController } from './dia-semana.controller';
import { DiaSemana } from './entities/dia-semana.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiaSemana])],
  controllers: [DiaSemanaController],
  providers: [DiaSemanaService],
  exports: [DiaSemanaService]
})
export class DiaSemanaModule {}
