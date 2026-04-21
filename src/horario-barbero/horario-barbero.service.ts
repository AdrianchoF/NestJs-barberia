import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaSemana, HorarioBarbero, PausaBarbero } from './entities/horario-barbero.entity';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
import { User, Role } from 'src/auth/entities/user.entity';
import { CreatePausaDto, UpdatePausaDto } from './dto/pausa-barbero.dto';
import { Cita, EstadoCita } from 'src/cita/entities/cita.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class HorarioBarberoService {
  private readonly logger = new Logger(HorarioBarberoService.name);

  constructor(
    @InjectRepository(HorarioBarbero)
    private readonly horarioRepository: Repository<HorarioBarbero>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cita)
    private readonly citaRepository: Repository<Cita>,
  ) { }

  // Cron Job: Limpieza diaria de pausas ocasionales expiradas (se ejecuta a las 2:00 AM)
  @Cron('0 2 * * *')
  async limpiarPausasOcasionalesExpiradas() {
    this.logger.debug('Ejecutando Cron Job: Limpiando pausas ocasionales expiradas...');
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    try {
      // Buscar todos los horarios que tienen pausas
      const horarios = await this.horarioRepository.find();
      let pausasEliminadas = 0;

      for (const horario of horarios) {
        if (!horario.pausas || horario.pausas.length === 0) continue;

        const pausasOriginales = horario.pausas.length;
        // Filtrar: mantener recurrentes + ocasionales que NO hayan expirado
        horario.pausas = horario.pausas.filter(pausa => {
          if (pausa.tipo !== 'ocasional') return true; // Mantener recurrentes
          if (!pausa.fecha) return true; // Sin fecha, mantener por seguridad
          return pausa.fecha >= hoyStr; // Mantener solo si la fecha es hoy o futura
        });

        const eliminadas = pausasOriginales - horario.pausas.length;
        if (eliminadas > 0) {
          await this.horarioRepository.save(horario);
          pausasEliminadas += eliminadas;
        }
      }

      if (pausasEliminadas > 0) {
        this.logger.log(`Limpieza completada: ${pausasEliminadas} pausa(s) ocasional(es) expirada(s) eliminada(s).`);
      } else {
        this.logger.debug('No se encontraron pausas ocasionales expiradas.');
      }
    } catch (error) {
      this.logger.error('Error al limpiar pausas expiradas:', error);
    }
  }

  async create(dto: CreateHorarioBarberoDto, user?: any) {
    const { barberoId, diasemana, hora_inicio, hora_fin } = dto;

    // Validar propiedad (solo el barbero mismo o admin)
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (user.id !== barberoId) {
        throw new ForbiddenException('No tienes permiso para gestionar el horario de otro barbero');
      }
    }

    // Buscar y asignar la entidad User (barbero)
    const barbero = await this.userRepository.findOne({
      where: { id: dto.barberoId },
    });

    if (!barbero) {
      throw new BadRequestException('El barbero no existe');
    }

    if (barbero.role !== Role.BARBERO && !barbero.esBarbero) {
      throw new BadRequestException('El usuario no tiene rol de barbero o no está habilitado como tal');
    }

    // Verificar solapamiento de franjas horarias para el mismo barbero y dia
    const existingHorarios = await this.horarioRepository.find({
      where: {
        barbero: { id: barberoId },
        Dia_semana: diasemana
      },
    });

    const newFranjaInicio = new Date(`1970-01-01 ${hora_inicio}`);
    const newFranjaFin = new Date(`1970-01-01 ${hora_fin}`);

    for (const existingHorario of existingHorarios) {
      const existingFranjaInicio = new Date(`1970-01-01 ${existingHorario.hora_inicio}`);
      const existingFranjaFin = new Date(`1970-01-01 ${existingHorario.hora_fin}`);

      if (
        (newFranjaInicio < existingFranjaFin && newFranjaFin > existingFranjaInicio) ||
        (existingFranjaInicio < newFranjaFin && existingFranjaFin > newFranjaInicio)
      ) {
        throw new BadRequestException('La nueva franja horaria se cruza con un horario ya creado para este barbero')
      }
    }

    // Verificar horarios duplicados
    const existingHorario = await this.horarioRepository.findOne({
      where: { barbero: { id: barberoId }, Dia_semana: diasemana, hora_inicio, hora_fin }
    });
    if (existingHorario) {
      throw new BadRequestException('Este horario ya esta registrado para este barbero');
    }

    // Crear y guardar el horario
    const horario = this.horarioRepository.create({
      barbero,
      Dia_semana: diasemana,
      hora_inicio,
      hora_fin
    });

    return await this.horarioRepository.save(horario);
  }

  async buscarporDiayHora(diaSemana: DiaSemana, hora: string): Promise<any[]> {
    const horarios = await this.horarioRepository
      .createQueryBuilder('horario')
      .innerJoinAndSelect('horario.barbero', 'barbero')
      .where('horario.Dia_semana = :diaSemana', { diaSemana })
      .andWhere('TIME(:hora) BETWEEN horario.hora_inicio AND horario.hora_fin', { hora })
      .andWhere('barbero.activo = :activo', { activo: true })
      .getMany();

    // Retornar solo los barberos únicos (sin duplicados)
    const barberosUnicos = Array.from(
      new Map(horarios.map(h => [h.barbero.id, h.barbero])).values()
    );

    return barberosUnicos;
  }

  async buscarHorariosPorDiaYHoraYFin(diaSemana: DiaSemana, horaInicio: string, horaFin: string): Promise<HorarioBarbero[]> {
    return await this.horarioRepository
      .createQueryBuilder('horario')
      .innerJoinAndSelect('horario.barbero', 'barbero')
      .where('horario.Dia_semana = :diaSemana', { diaSemana })
      .andWhere('horario.hora_inicio <= :horaInicio', { horaInicio })
      .andWhere('horario.hora_fin >= :horaFin', { horaFin })
      .andWhere('barbero.activo = :activo', { activo: true })
      .getMany();
  }

  async findAll() {
    return await this.horarioRepository.find({
      relations: ['barbero'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id },
      relations: ['barbero'],
    });
    if (!horario) {
      throw new BadRequestException(`Horario con ID ${id} no encontrado`);
    }
    return horario;
  }

  async findByBarbero(barberoId: number) {
    const horarios = await this.horarioRepository.find({
      where: { barbero: { id: barberoId } },
      relations: ['barbero'],
      order: { Dia_semana: 'ASC', hora_inicio: 'ASC' },
    });

    if (!horarios || horarios.length === 0) {
      return [];
    }

    return horarios;
  }

  async remove(id: number, user?: any) {
    const horario = await this.findOne(id);
    
    // Validar propiedad
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (horario.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para eliminar el horario de otro barbero');
      }
    }

    await this.horarioRepository.remove(horario);
    return { message: `Horario con ID ${id} eliminado correctamente` };
  }

  // Métodos para gestionar pausas
  async agregarPausa(horarioId: number, dto: CreatePausaDto, user?: any) {
    const horario = await this.findOne(horarioId);

    // Validar propiedad
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (horario.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para gestionar pausas de otro barbero');
      }
    }

    // Validar que la pausa no se solape con el horario principal
    const pausaInicio = new Date(`1970-01-01 ${dto.hora_inicio}`);
    const pausaFin = new Date(`1970-01-01 ${dto.hora_fin}`);
    const horarioInicio = new Date(`1970-01-01 ${horario.hora_inicio}`);
    const horarioFin = new Date(`1970-01-01 ${horario.hora_fin}`);

    if (pausaInicio < horarioInicio || pausaFin > horarioFin) {
      throw new BadRequestException('La pausa debe estar dentro del horario de trabajo');
    }

    // Crear pausa
    const nuevaPausa: PausaBarbero = {
      id: crypto.randomUUID(),
      ...dto
    };

    // Si todos_los_dias = true, aplicar a todos los horarios del barbero
    if (dto.tipo === 'recurrente' && dto.todos_los_dias) {
      const horariosDelBarbero = await this.horarioRepository.find({
        where: { barbero: { id: horario.barbero.id } },
        relations: ['barbero']
      });

      for (const h of horariosDelBarbero) {
        // Validar que la pausa cabe en cada horario
        const hInicio = new Date(`1970-01-01 ${h.hora_inicio}`);
        const hFin = new Date(`1970-01-01 ${h.hora_fin}`);

        if (pausaInicio < hInicio || pausaFin > hFin) {
          throw new BadRequestException(`La pausa no cabe en el horario del ${h.Dia_semana}`);
        }

        // Verificar solapamiento con otras pausas y citas en este horario
        await this.validarSolapamientoPausasYCitas(h, nuevaPausa);

        // Agregar la pausa al horario (MISMO ID para todos los horarios - permite deduplicación)
        if (!h.pausas) {
          h.pausas = [];
        }
        h.pausas.push(nuevaPausa);
      }

      await this.horarioRepository.save(horariosDelBarbero);
    } else {
      // Si es ocasional o solo para este día, agregar solo a este horario
      await this.validarSolapamientoPausasYCitas(horario, nuevaPausa);

      if (!horario.pausas) {
        horario.pausas = [];
      }
      horario.pausas.push(nuevaPausa);
      await this.horarioRepository.save(horario);
    }

    return nuevaPausa;
  }

  private async validarSolapamientoPausasYCitas(horario: HorarioBarbero, nuevaPausa: PausaBarbero) {
    // Validar solapamiento con otras pausas
    if (horario.pausas) {
      for (const pausa of horario.pausas) {
        const existingInicio = new Date(`1970-01-01 ${pausa.hora_inicio}`);
        const existingFin = new Date(`1970-01-01 ${pausa.hora_fin}`);
        const nuevaInicio = new Date(`1970-01-01 ${nuevaPausa.hora_inicio}`);
        const nuevaFin = new Date(`1970-01-01 ${nuevaPausa.hora_fin}`);

        if ((nuevaInicio < existingFin && nuevaFin > existingInicio) ||
            (existingInicio < nuevaFin && existingFin > nuevaInicio)) {
          throw new BadRequestException('Esta pausa se solapa con otra pausa existente');
        }
      }
    }

    // Validar solapamiento con citas existentes
    // Para pausas ocasionales, usar la fecha proporcionada; para recurrentes, usar cualquier fecha en ese día
    let fechaBusqueda: Date;
    if (nuevaPausa.tipo === 'ocasional' && nuevaPausa.fecha) {
      fechaBusqueda = new Date(nuevaPausa.fecha);
    } else {
      // Para recurrentes, obtener la fecha del día actual de la semana especificado
      const dia_semana_num = this.mapearDiaSemana(horario.Dia_semana);
      fechaBusqueda = this.obtenerProximaFechaDelDia(dia_semana_num);
    }

    const citas = await this.citaRepository
      .createQueryBuilder('cita')
      .leftJoinAndSelect('cita.servicio', 'servicio')
      .where('cita.Id_RolBarbero = :barberoId', { barberoId: horario.barbero.id })
      .andWhere('DATE(cita.fecha) = :fecha', { fecha: fechaBusqueda.toISOString().split('T')[0] })
      .andWhere('cita.estado != :cancelada', { cancelada: EstadoCita.CANCELADA })
      .getMany();

    for (const cita of citas) {
      const citaInicio = new Date(`1970-01-01 ${cita.hora}`);
      // Calcular hora fin de la cita sumando la duración del servicio
      let citaFin = new Date(`1970-01-01 ${cita.hora}`);
      if (cita.servicio && cita.servicio.duracionAprox) {
        const [horas, minutos] = cita.servicio.duracionAprox.split(':').map(Number);
        citaFin.setHours(citaFin.getHours() + horas, citaFin.getMinutes() + minutos);
      } else {
        // Si no hay duración, asumir 30 minutos por defecto
        citaFin.setMinutes(citaFin.getMinutes() + 30);
      }

      const nuevaInicio = new Date(`1970-01-01 ${nuevaPausa.hora_inicio}`);
      const nuevaFin = new Date(`1970-01-01 ${nuevaPausa.hora_fin}`);

      if ((nuevaInicio < citaFin && nuevaFin > citaInicio) ||
          (citaInicio < nuevaFin && citaFin > nuevaInicio)) {
        throw new BadRequestException(
          `No se puede crear pausa: hay una cita existente que se solapa (${cita.hora} - ${this.sumarTiempo(cita.hora, cita.servicio?.duracionAprox || '00:30')})`
        );
      }
    }
  }

  private mapearDiaSemana(dia: string): number {
    const dias = {
      'lunes': 0,
      'martes': 1,
      'miercoles': 2,
      'jueves': 3,
      'viernes': 4,
      'sabado': 5,
      'domingo': 6
    };
    return dias[dia.toLowerCase()] || 0;
  }

  private obtenerProximaFechaDelDia(diaSemana: number): Date {
    const hoy = new Date();
    const distancia = (diaSemana - hoy.getDay() + 7) % 7 || 7;
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + distancia);
    return fecha;
  }

  private sumarTiempo(horaStr: string, duracionStr: string): string {
    const [h, m] = horaStr.split(':').map(Number);
    const [dh, dm] = duracionStr.split(':').map(Number);
    let nuevaHora = h + dh;
    let nuevoMinuto = m + dm;
    if (nuevoMinuto >= 60) {
      nuevaHora += Math.floor(nuevoMinuto / 60);
      nuevoMinuto = nuevoMinuto % 60;
    }
    return `${String(nuevaHora).padStart(2, '0')}:${String(nuevoMinuto).padStart(2, '0')}`;
  }

  async actualizarPausa(horarioId: number, pausaId: string, dto: UpdatePausaDto, user?: any) {
    const horario = await this.findOne(horarioId);

    // Validar propiedad
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (horario.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para gestionar pausas de otro barbero');
      }
    }

    const pausaIndex = horario.pausas?.findIndex(p => p.id === pausaId);
    if (pausaIndex === undefined || pausaIndex === -1) {
      throw new BadRequestException('Pausa no encontrada');
    }

    // Validar solapamientos (similar a agregar)
    const pausaInicio = new Date(`1970-01-01 ${dto.hora_inicio}`);
    const pausaFin = new Date(`1970-01-01 ${dto.hora_fin}`);
    const horarioInicio = new Date(`1970-01-01 ${horario.hora_inicio}`);
    const horarioFin = new Date(`1970-01-01 ${horario.hora_fin}`);

    if (pausaInicio < horarioInicio || pausaFin > horarioFin) {
      throw new BadRequestException('La pausa debe estar dentro del horario de trabajo');
    }

    // Actualizar pausa
    horario.pausas[pausaIndex] = { ...horario.pausas[pausaIndex], ...dto };
    await this.horarioRepository.save(horario);
    return horario.pausas[pausaIndex];
  }

  async eliminarPausa(horarioId: number, pausaId: string, user?: any) {
    const horario = await this.findOne(horarioId);

    // Validar propiedad
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (horario.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para gestionar pausas de otro barbero');
      }
    }

    const pausaIndex = horario.pausas?.findIndex(p => p.id === pausaId);
    if (pausaIndex === undefined || pausaIndex === -1) {
      throw new BadRequestException('Pausa no encontrada');
    }

    horario.pausas.splice(pausaIndex, 1);
    await this.horarioRepository.save(horario);
    return { message: 'Pausa eliminada correctamente' };
  }

  // Método para obtener pausas activas para un barbero en una fecha específica
  async obtenerPausasActivas(barberoId: number, fecha: Date): Promise<PausaBarbero[]> {
    const diaSemana = this.getDiaSemana(fecha);
    const horarios = await this.horarioRepository.find({
      where: { barbero: { id: barberoId }, Dia_semana: diaSemana },
      relations: ['barbero']
    });

    const pausasActivas: PausaBarbero[] = [];
    const fechaStr = fecha.toISOString().split('T')[0];

    for (const horario of horarios) {
      if (horario.pausas) {
        for (const pausa of horario.pausas) {
          if (pausa.tipo === 'recurrente' && pausa.todos_los_dias !== false) {
            pausasActivas.push(pausa);
          } else if (pausa.tipo === 'ocasional' && pausa.fecha === fechaStr) {
            pausasActivas.push(pausa);
          }
        }
      }
    }

    return pausasActivas;
  }

  private getDiaSemana(fecha: Date): DiaSemana {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[fecha.getDay()] as DiaSemana;
  }

  // Método para obtener huecos libres en un día para un barbero
  async obtenerHuecosLibres(barberoId: number, fecha: Date, duracionMinutos: number = 60): Promise<{hora_inicio: string, hora_fin: string}[]> {
    const diaSemana = this.getDiaSemana(fecha);
    const horarios = await this.horarioRepository.find({
      where: { barbero: { id: barberoId }, Dia_semana: diaSemana },
      relations: ['barbero']
    });

    if (horarios.length === 0) return [];

    const huecos: {hora_inicio: string, hora_fin: string}[] = [];
    const fechaStr = fecha.toISOString().split('T')[0];

    for (const horario of horarios) {
      let horaActual = horario.hora_inicio;
      const horaFinHorario = horario.hora_fin;

      // Obtener citas del día
      const citas = await this.citaRepository
        .createQueryBuilder('cita')
        .innerJoinAndSelect('cita.servicio', 'servicio')
        .where('cita.Id_RolBarbero = :idBarbero', { idBarbero: barberoId })
        .andWhere('cita.fecha = :fecha', { fecha })
        .andWhere('cita.estado != :cancelada', { cancelada: EstadoCita.CANCELADA })
        .orderBy('cita.hora', 'ASC')
        .getMany();

      // Obtener pausas activas
      const pausas = horario.pausas || [];

      // Combinar citas y pausas como bloques ocupados
      const bloquesOcupados = [
        ...citas.map(cita => ({
          inicio: cita.hora.toString(),
          fin: this.sumarMinutosAHora(cita.hora.toString(), Number(cita.servicio.duracionAprox) + 10) // +10 min buffer
        })),
        ...pausas.map(pausa => ({
          inicio: pausa.hora_inicio,
          fin: pausa.hora_fin
        }))
      ].sort((a, b) => a.inicio.localeCompare(b.inicio));

      // Encontrar huecos entre bloques ocupados
      let ultimoFin = horario.hora_inicio;

      for (const bloque of bloquesOcupados) {
        if (this.horaAMinutos(bloque.inicio) > this.horaAMinutos(ultimoFin)) {
          const duracionHueco = this.horaAMinutos(bloque.inicio) - this.horaAMinutos(ultimoFin);
          if (duracionHueco >= duracionMinutos) {
            huecos.push({
              hora_inicio: ultimoFin,
              hora_fin: bloque.inicio
            });
          }
        }
        ultimoFin = this.maxHora(ultimoFin, bloque.fin);
      }

      // Verificar hueco después del último bloque hasta el fin del horario
      if (this.horaAMinutos(horaFinHorario) > this.horaAMinutos(ultimoFin)) {
        const duracionHueco = this.horaAMinutos(horaFinHorario) - this.horaAMinutos(ultimoFin);
        if (duracionHueco >= duracionMinutos) {
          huecos.push({
            hora_inicio: ultimoFin,
            hora_fin: horaFinHorario
          });
        }
      }
    }

    return huecos;
  }

  private horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  private sumarMinutosAHora(hora: string, minutos: number): string {
    const totalMin = this.horaAMinutos(hora) + minutos;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }

  private maxHora(hora1: string, hora2: string): string {
    return this.horaAMinutos(hora1) > this.horaAMinutos(hora2) ? hora1 : hora2;
  }

  async obtenerTodasLasPausasDelBarbero(barberoId: number): Promise<any[]> {
    const horarios = await this.horarioRepository.find({
      where: { barbero: { id: barberoId } },
      relations: ['barbero']
    });

    const pausasConDia: any[] = [];
    const pausasYaAgregadas = new Set<string>();

    for (const horario of horarios) {
      if (horario.pausas && horario.pausas.length > 0) {
        for (const pausa of horario.pausas) {
          // Crear clave de deduplicación basada en hora_inicio, hora_fin, tipo y todos_los_dias
          const clave = `${pausa.hora_inicio}-${pausa.hora_fin}-${pausa.tipo}-${pausa.todos_los_dias}`;
          
          // Para pausas recurrentes con todos_los_dias, solo agregamos una vez
          if (pausa.todos_los_dias && pausasYaAgregadas.has(clave)) {
            continue;
          }

          const diasAplicables = pausa.todos_los_dias ? 
            'Todos los días' :
            horario.Dia_semana;

          pausasConDia.push({
            ...pausa,
            dia: horario.Dia_semana,
            diasAplicables: diasAplicables,
            horarioId: horario.id // Agregar ID del horario para operaciones posteriores
          });

          if (pausa.todos_los_dias) {
            pausasYaAgregadas.add(clave);
          }
        }
      }
    }

    return pausasConDia.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }
}