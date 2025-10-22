import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HorarioBarberoService } from './horario-barbero.service';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
import { DiaSemana } from './entities/horario-barbero.entity';
//import { UpdateHorarioBarberoDto } from './dto/update-horario-barbero.dto';

@Controller('horario-barbero')
export class HorarioBarberoController {
  constructor(private readonly horarioBarberoService: HorarioBarberoService) {}

  @Post()
  create(@Body() dto: CreateHorarioBarberoDto) {
    return this.horarioBarberoService.create(dto);
  }

  @Get()
  findAll() {
    return this.horarioBarberoService.findAll();
  }

  @Get(':dia/:hora')
  findhorario(@Param('dia') dia: DiaSemana,
    @Param('hora') hora : string) {
    console.log(hora)
    return this.horarioBarberoService.buscarporDiayHora(dia,hora);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horarioBarberoService.findOne(+id);
  }

  /* @Patch(':id')
  update(@Param('id') id: string, @Body() updateHorarioBarberoDto: UpdateHorarioBarberoDto) {
    return this.horarioBarberoService.update(+id, updateHorarioBarberoDto);
  } */

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.horarioBarberoService.remove(+id);
  }
}
