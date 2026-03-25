import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CitaService } from './cita.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cita')
export class CitaController {
  constructor(private readonly citaService: CitaService) {}

  @Roles(Role.CLIENTE, Role.BARBERO, Role.ADMINISTRADOR)
  @Post()
  create(@Body() createCitaDto: CreateCitaDto) {
    return this.citaService.create(createCitaDto);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO, Role.CLIENTE)
  @Get()
  findAll(@Request() req: any) {
    return this.citaService.findAll(req.user);
  }

  // ✅ Rutas específicas primero
  @Public()
  @Get('barbero/:barberoId/ocupadas/:fecha')
  async obtenerHorasOcupadasBarbero(
    @Param('barberoId') barberoId: string,
    @Param('fecha') fecha: string
  ) {
    return this.citaService.obtenerHorasOcupadasBarbero(+barberoId, fecha);
  }

  @Public()
  @Get(':fecha/:hora/:idservicio')
  findhorario(
    @Param('fecha') fecha: Date, 
    @Param('hora') hora: string, 
    @Param('idservicio') idservicio: string
  ) {
    return this.citaService.obtenerBarberosDisponiblesParaCita(fecha, hora, +idservicio);
  }

  // ✅ Ruta genérica :id al final de los GET
  @Roles(Role.ADMINISTRADOR, Role.BARBERO, Role.CLIENTE)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.citaService.findOne(+id, req.user);
  }

  // PATCH están bien, porque son más específicos
  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string, 
    @Body() updateEstadoDto: UpdateEstadoCitaDto,
    @Request() req: any
  ) {
    return this.citaService.actualizarEstado(+id, updateEstadoDto, req.user);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO, Role.CLIENTE)
  @Patch(':id/cancelar')
  cancelarCita(@Param('id') id: string, @Request() req: any) {
    return this.citaService.cancelarCita(+id, req.user);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Patch(':id/completar')
  completarCita(@Param('id') id: string, @Request() req: any) {
    return this.citaService.completarCita(+id, req.user);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitaDto: UpdateCitaDto) {
    return this.citaService.update(+id, updateCitaDto);
  }

  @Roles(Role.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citaService.remove(+id);
  }
}