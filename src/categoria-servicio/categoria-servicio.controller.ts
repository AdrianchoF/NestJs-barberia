import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriaServicioService } from './categoria-servicio.service';
import { CreateCategoriaServicioDto } from './dto/create-categoria-servicio.dto';
import { UpdateCategoriaServicioDto } from './dto/update-categoria-servicio.dto';

@Controller('categoria-servicio')
export class CategoriaServicioController {
  constructor(private readonly categoriaServicioService: CategoriaServicioService) {}

  @Post()
  create(@Body() createCategoriaServicioDto: CreateCategoriaServicioDto) {
    return this.categoriaServicioService.create(createCategoriaServicioDto);
  }

  @Get()
  findAll() {
    return this.categoriaServicioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaServicioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaServicioDto: UpdateCategoriaServicioDto) {
    return this.categoriaServicioService.update(+id, updateCategoriaServicioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaServicioService.remove(+id);
  }
}
