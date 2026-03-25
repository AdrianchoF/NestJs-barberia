import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriaProductoService } from './categoria-producto.service';
import { CreateCategoriaProductoDto } from './dto/create-categoria-producto.dto';
import { UpdateCategoriaProductoDto } from './dto/update-categoria-producto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categoria-producto')
export class CategoriaProductoController {
  constructor(private readonly categoriaProductoService: CategoriaProductoService) {}

  @Roles(Role.ADMINISTRADOR)
  @Post()
  create(@Body() createCategoriaProductoDto: CreateCategoriaProductoDto) {
    return this.categoriaProductoService.create(createCategoriaProductoDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriaProductoService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaProductoService.findOne(+id);
  }

  @Roles(Role.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaProductoDto: UpdateCategoriaProductoDto) {
    return this.categoriaProductoService.update(+id, updateCategoriaProductoDto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaProductoService.remove(+id);
  }
}