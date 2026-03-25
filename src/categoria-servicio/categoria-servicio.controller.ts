import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriaServicioService } from './categoria-servicio.service';
import { CreateCategoriaServicioDto } from './dto/create-categoria-servicio.dto';
import { UpdateCategoriaServicioDto } from './dto/update-categoria-servicio.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categoria-servicio')
export class CategoriaServicioController {
  constructor(private readonly categoriaServicioService: CategoriaServicioService) {}

  @Roles(Role.ADMINISTRADOR)
  @Post()
  create(@Body() createCategoriaServicioDto: CreateCategoriaServicioDto) {
    return this.categoriaServicioService.create(createCategoriaServicioDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.categoriaServicioService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaServicioService.findOne(+id);
  }

  @Roles(Role.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoriaServicioDto: UpdateCategoriaServicioDto) {
    return this.categoriaServicioService.update(+id, updateCategoriaServicioDto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaServicioService.remove(+id);
  }
}
