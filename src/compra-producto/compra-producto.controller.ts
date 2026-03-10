import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompraProductoService } from './compra-producto.service';
import { CreateCompraProductoDto } from './dto/create-compra-producto.dto';
import { UpdateCompraProductoDto } from './dto/update-compra-producto.dto';

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
