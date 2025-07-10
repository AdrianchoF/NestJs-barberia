import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DiaSemanaService } from './dia-semana.service';
import { CreateDiaSemanaDto } from './dto/create-dia-semana.dto';
//import { UpdateDiaSemanaDto } from './dto/update-dia-semana.dto';

@Controller('dia-semana')
export class DiaSemanaController {
  constructor(private readonly diaSemanaService: DiaSemanaService) {}

  @Post()
  create(@Body() dto: CreateDiaSemanaDto) {
    return this.diaSemanaService.create(dto);
  }

  @Get()
  findAll() {
    return this.diaSemanaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diaSemanaService.findOne(+id);
  }

  /* @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiaSemanaDto: UpdateDiaSemanaDto) {
    return this.diaSemanaService.update(+id, updateDiaSemanaDto);
  }
 */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diaSemanaService.remove(+id);
  }
}
