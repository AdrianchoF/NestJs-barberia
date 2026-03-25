import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompraProductoService } from './compra-producto.service';
import { CreateCompraProductoDto } from './dto/create-compra-producto.dto';
import { UpdateCompraProductoDto } from './dto/update-compra-producto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR, Role.BARBERO)
@Controller('compra-producto')
export class CompraProductoController {
  constructor(private readonly compraProductoService: CompraProductoService) { }

  @Post()
  create(@Body() createCompraProductoDto: CreateCompraProductoDto) {
    return this.compraProductoService.create(createCompraProductoDto);
  }

  @Get()
  findAll() {
    return this.compraProductoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compraProductoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompraProductoDto: UpdateCompraProductoDto) {
    return this.compraProductoService.update(+id, updateCompraProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compraProductoService.remove(+id);
  }

  @Post(':id/entregar')
  entregar(@Param('id') id: string, @Body('fecha_entrega') fecha: string) {
    const fechaObj = fecha ? new Date(fecha) : undefined;
    return this.compraProductoService.marcarEntregada(+id, fechaObj);
  }

  @Post(':id/detalles')
  async addDetalles(@Param('id') id: string, @Body() detalles: any[]) {
    return this.compraProductoService.addDetalles(+id, detalles);
  }
}
