import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { FranjaHorariaService } from './franja-horaria.service';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
import { UpdateFranjaHorariaDto } from './dto/update-franja-horaria.dto';

@Controller('franja-horaria')
export class FranjaHorariaController {
  constructor(private readonly franjaHorariaService: FranjaHorariaService) {}

  @Post()
  create(@Body() createFranjaHorariaDto: CreateFranjaHorariaDto) {
    return this.franjaHorariaService.create(createFranjaHorariaDto);
  }

  @Get()
  findAll() {
    return this.franjaHorariaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.franjaHorariaService.findOne(+id);
  }

    @Patch(':id')
  update(@Param('id') id: string, @Body() updateFranjaHorariaDto: UpdateFranjaHorariaDto) {
    return this.franjaHorariaService.update(+id, updateFranjaHorariaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.franjaHorariaService.remove(+id);
  }
}