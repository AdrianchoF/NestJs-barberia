import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servicio')
export class ServicioController {
  constructor(private readonly servicioService: ServicioService) { }

  @Roles(Role.ADMINISTRADOR)
  @Post()
  create(@Body() createServicioDto: CreateServicioDto) {
    return this.servicioService.create(createServicioDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.servicioService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicioService.findOne(+id);
  }

  @Roles(Role.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServicioDto: UpdateServicioDto) {
    return this.servicioService.update(+id, updateServicioDto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicioService.remove(+id);
  }
}
