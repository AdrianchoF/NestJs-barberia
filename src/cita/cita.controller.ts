import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CitaService } from './cita.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';
import { DiaSemana } from 'src/horario-barbero/entities/horario-barbero.entity';

@Controller('cita')
export class CitaController {
  constructor(private readonly citaService: CitaService) {}

  @Post()
  create(@Body() createCitaDto: CreateCitaDto) {
    return this.citaService.create(createCitaDto);
  }

  @Get()
  findAll() {
    return this.citaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citaService.findOne(+id);
  }

  @Get(':fecha/:hora/:idservicio')
  findhorario(@Param('fecha') fecha: Date, @Param('hora') hora : string, @Param('idservicio') idservicio : string) {
    return this.citaService.obtenerBarberosDisponiblesParaCita(fecha,hora,+idservicio);
  }

  // ✨ NUEVO: Endpoint para actualizar el estado de una cita
  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string, 
    @Body() updateEstadoDto: UpdateEstadoCitaDto
  ) {
    return this.citaService.actualizarEstado(+id, updateEstadoDto);
  }

  // ✨ NUEVO: Endpoint conveniente para cancelar cita
  @Patch(':id/cancelar')
  cancelarCita(@Param('id') id: string) {
    return this.citaService.cancelarCita(+id);
  }

  // ✨ NUEVO: Endpoint conveniente para completar cita (barberos/admin)
  @Patch(':id/completar')
  completarCita(@Param('id') id: string) {
    return this.citaService.completarCita(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitaDto: UpdateCitaDto) {
    return this.citaService.update(+id, updateCitaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citaService.remove(+id);
  }
}
