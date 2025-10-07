import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriaProductoService } from './categoria-producto.service';
import { CreateCategoriaProductoDto } from './dto/create-categoria-producto.dto';
import { UpdateCategoriaProductoDto } from './dto/update-categoria-producto.dto';

@Controller('categoria-producto')
export class CategoriaProductoController {
  constructor(private readonly categoriaProductoService: CategoriaProductoService) {}

  @Post()
  create(@Body() createCategoriaProductoDto: CreateCategoriaProductoDto) {
    return this.categoriaProductoService.create(createCategoriaProductoDto);
  }

  @Get()
  findAll() {
    return this.categoriaProductoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaProductoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaProductoDto: UpdateCategoriaProductoDto) {
    return this.categoriaProductoService.update(+id, updateCategoriaProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaProductoService.remove(+id);
  }
}