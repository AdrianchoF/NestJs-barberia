import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HorarioBarberoService } from './horario-barbero.service';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
import { DiaSemana } from './entities/horario-barbero.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreatePausaDto, UpdatePausaDto } from './dto/pausa-barbero.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('horario-barbero')
export class HorarioBarberoController {
  constructor(private readonly horarioBarberoService: HorarioBarberoService) {}

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Post()
  create(@Body() dto: CreateHorarioBarberoDto, @Request() req: any) {
    return this.horarioBarberoService.create(dto, req.user);
  }

  @Public()
  @Get()
  findAll() {
    return this.horarioBarberoService.findAll();
  }

  // Agregar ANTES del @Get(':id') para que no haya conflicto de rutas
  @Public()
  @Get('barbero/:barberoId')
  findByBarbero(@Param('barberoId') barberoId: string) {
    return this.horarioBarberoService.findByBarbero(+barberoId);
  }

  @Public()
  @Get(':dia/:hora')
  findhorario(@Param('dia') dia: DiaSemana,
    @Param('hora') hora : string) {
    console.log(hora)
    return this.horarioBarberoService.buscarporDiayHora(dia,hora);
  }

  // Endpoints específicos de pausas - ANTES de los endpoints genéricos
  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Get('pausas-barbero/:barberoId')
  async obtenerTodasLasPausasDelBarbero(@Param('barberoId') barberoId: string) {
    return this.horarioBarberoService.obtenerTodasLasPausasDelBarbero(+barberoId);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Get('huecos-libres/:barberoId/:fecha/:duracion')
  obtenerHuecosLibres(
    @Param('barberoId') barberoId: string,
    @Param('fecha') fecha: string,
    @Param('duracion') duracion: string
  ) {
    const fechaDate = new Date(`${fecha}T00:00:00`);
    return this.horarioBarberoService.obtenerHuecosLibres(+barberoId, fechaDate, +duracion);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horarioBarberoService.findOne(+id);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.horarioBarberoService.remove(+id, req.user);
  }

  // Endpoints para gestionar pausas
  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Post(':horarioId/pausas')
  agregarPausa(
    @Param('horarioId') horarioId: string,
    @Body() dto: CreatePausaDto,
    @Request() req: any
  ) {
    return this.horarioBarberoService.agregarPausa(+horarioId, dto, req.user);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Patch(':horarioId/pausas/:pausaId')
  actualizarPausa(
    @Param('horarioId') horarioId: string,
    @Param('pausaId') pausaId: string,
    @Body() dto: UpdatePausaDto,
    @Request() req: any
  ) {
    return this.horarioBarberoService.actualizarPausa(+horarioId, pausaId, dto, req.user);
  }

  @Roles(Role.ADMINISTRADOR, Role.BARBERO)
  @Delete(':horarioId/pausas/:pausaId')
  eliminarPausa(
    @Param('horarioId') horarioId: string,
    @Param('pausaId') pausaId: string,
    @Request() req: any
  ) {
    return this.horarioBarberoService.eliminarPausa(+horarioId, pausaId, req.user);
  }
}
