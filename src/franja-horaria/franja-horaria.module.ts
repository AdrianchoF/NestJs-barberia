import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranjaHorariaService } from './franja-horaria.service';
import { FranjaHorariaController } from './franja-horaria.controller';
import { FranjaHoraria } from './entities/franja-horaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FranjaHoraria])],
  controllers: [FranjaHorariaController],
  providers: [FranjaHorariaService],
  exports: [FranjaHorariaService],
})
export class FranjaHorariaModule {}
