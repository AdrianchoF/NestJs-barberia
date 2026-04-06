import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from 'src/servicio/entities/servicio.entity';
import { Repository } from 'typeorm';
import { DiaSemana, HorarioBarbero } from 'src/horario-barbero/entities/horario-barbero.entity';
import { HorarioBarberoService } from 'src/horario-barbero/horario-barbero.service';
import { Cita, EstadoCita } from './entities/cita.entity';
import { Duration } from 'luxon';
import { MailService } from 'src/mail/mail.service';
import { Role } from 'src/auth/entities/user.entity';
@Injectable()
export class CitaService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,

    @InjectRepository(Cita)
    private readonly citaRepository: Repository<Cita>,

    private readonly horarioBarberoService: HorarioBarberoService,
    private readonly mailService: MailService,
  ) {}

  async create(createCitaDto: CreateCitaDto) {
  const { clienteId, barberoId, servicioId, hora, fecha, estado } = createCitaDto;

  // Validar que la fecha no sea en el pasado
  const fechaHoy = new Date();
  const fechaCita = new Date(fecha + 'T' + hora);
  if (fechaCita < fechaHoy) {
    throw new BadRequestException('No se puede agendar una cita en el pasado');
  }

  // Verificar que el cliente existe con sus datos completos
  const cliente = await this.citaRepository.manager.findOne('User', { where: { id: clienteId } }) as any;
  if (!cliente) {
    throw new BadRequestException(`Cliente con ID ${clienteId} no encontrado`);
  }

  // Verificar que el barbero existe con sus datos completos
  const barbero = await this.citaRepository.manager.findOne('User', { where: { id: barberoId } }) as any;
  if (!barbero) {
    throw new BadRequestException(`Barbero con ID ${barberoId} no encontrado`);
  }

  // Validar que el barbero trabaje ese dia y hora
  const diaSemana = this.extraerDiaSemanaDelaFecha(fecha);
  if(!(await this.barberoTrabajaEnDiaYHora(barberoId, diaSemana, hora))) {
    throw new BadRequestException(`El barbero con ID ${barberoId} no trabaja el ${diaSemana} a las ${hora}`);
  }

  // ✅ NUEVO: Procesar cada servicio
  const citasCreadas: Cita[] = [];
  const nombresServicios: string[] = [];
  let horaActual = hora; // Hora de inicio para la primera cita

  for (const idServicio of servicioId) {
    // Verificar que el servicio existe
    const servicio = await this.servicioRepository.findOne({ where: { id: idServicio } });
    if (!servicio) {
      throw new BadRequestException(`Servicio con ID ${idServicio} no encontrado`);
    }
    nombresServicios.push(servicio.nombre);

    // Calcular hora fin para este servicio
    const horaFin = this.sumTimes([horaActual, servicio.duracionAprox.toString()]);

    // Validar disponibilidad del barbero para este servicio
    const tieneConflictos = await this.barberoTieneCitasSolapadas(barberoId, fecha, horaActual, horaFin);

    if(tieneConflictos) {
      // Si hay conflictos, buscar alternativas
      const horariosSugeridos: string[] = [];
      const intervalos = [30, 60, 90]; // minutos después del horario original
      
      for(const minutosExtra of intervalos) {
        const nuevaHora = this.sumarMinutosAHora(hora, minutosExtra);
        const nuevaHoraFin = this.sumTimes([nuevaHora, servicio.duracionAprox.toString()]);
        const libre = !(await this.barberoTieneCitasSolapadas(barberoId, fecha, nuevaHora, nuevaHoraFin));
        if (libre) {
          horariosSugeridos.push(nuevaHora);
        }
      }

      // Buscar otros barberos en el mismo horario
      const otrosBarberosDisponibles = await this.obtenerBarberosDisponiblesParaCita(fecha, hora, [idServicio]);

      return {
        disponible: false,
        mensaje: `El barbero ${barberoId} no está disponible en el horario solicitado`,
        horarios_alternativos: horariosSugeridos,
        otros_barberos: otrosBarberosDisponibles.barberos_disponibles ?? [],
      };
    }

    // Crear la cita para este servicio
    const cita = this.citaRepository.create({
      cliente,
      barbero,
      servicio,
      hora: horaActual,
      fecha,
      estado: estado || 'agendada' // Cambiado a 'agendada' por defecto
    });

    const citaGuardada = await this.citaRepository.save(cita);
    citasCreadas.push(citaGuardada);

    // ✅ Actualizar hora para el siguiente servicio (si hay más)
    horaActual = horaFin;
  }

  // 📧 ENVIAR NOTIFICACIONES POR CORREO
  const fechaStr = fecha instanceof Date ? (fecha as any).toISOString().split('T')[0] : String(fecha);

  // 1️⃣ Correo al cliente
  if (cliente.email) {
    this.mailService.sendAppointmentConfirmation(
      cliente.email,
      cliente.nombre,
      barbero.nombre,
      nombresServicios,
      fechaStr,
      hora
    ).catch(err => console.error('Error al enviar notificación al cliente:', err));
  }

  // 2️⃣ Correo al barbero
  if (barbero.email) {
    this.mailService.sendBarberNotification(
      barbero.email,
      barbero.nombre,
      cliente.nombre,
      cliente.apellido,
      cliente.email,
      cliente.telefono,
      nombresServicios,
      fechaStr,
      hora
    ).catch(err => console.error('Error al enviar notificación al barbero:', err));
  }

  // 3️⃣ Correo al/los administrador(es) — buscados por rol en la BD
  try {
    const admins = await this.citaRepository.manager.find('User', { where: { role: Role.ADMINISTRADOR } }) as any[];
    for (const admin of admins) {
      if (admin.email) {
        this.mailService.sendAdminNotification(
          admin.email,
          cliente.nombre,
          cliente.apellido,
          cliente.email,
          cliente.telefono,
          barbero.nombre,
          barbero.email,
          nombresServicios,
          fechaStr,
          hora
        ).catch(err => console.error('Error al enviar notificación al admin:', err));
      }
    }
  } catch (err) {
    console.error('Error al buscar administradores para notificación:', err);
  }


  // ✅ Retornar todas las citas creadas
  return {
    disponible: true,
    mensaje: `${citasCreadas.length} cita(s) agendada(s) exitosamente`,
    citas: citasCreadas,
    total_citas: citasCreadas.length
  };
}

  async obtenerBarberosDisponiblesParaCita(fecha: Date, hora: string, servicioIds: number[]) {
    try {
      console.log('=== DEBUG OBTENER BARBEROS DISPONIBLES ===');
      console.log('Parámetros recibidos:', { fecha, hora, servicioIds });

      // 1. Extraer día de la semana de la fecha
      const diaSemana = this.extraerDiaSemanaDelaFecha(fecha);
      console.log('Día de la semana calculado:', diaSemana);
      
      // 2. Obtener duración TOTAL de todos los servicios
      let duracionTotal = Duration.fromObject({ hours: 0, minutes: 0, seconds: 0 });
      for (const idServicio of servicioIds) {
        const servicio = await this.servicioRepository.findOne({ where: { id: idServicio } });
        if (servicio) {
          const [h, m, s] = servicio.duracionAprox.toString().split(':').map(Number);
          duracionTotal = duracionTotal.plus(Duration.fromObject({ hours: h, minutes: m, seconds: s }));
        }
      }

      const totalDurationStr = `${Math.floor(duracionTotal.as('hours'))}:${duracionTotal.minutes % 60}:${duracionTotal.seconds % 60}`;
      console.log('Duración total calculada:', totalDurationStr);

      // 3. Calcular rango de tiempo que ocuparía la nueva cita
      const horaFormateada = hora;
      const horaFin = this.sumTimes([hora.toString(), totalDurationStr]); 
      console.log('Hora inicio:', horaFormateada, 'Hora fin:', horaFin);

      // 4. Obtener barberos que tienen franjas disponibles para este día y hora
      const barberosConFranjas = await this.horarioBarberoService.buscarporDiayHora(diaSemana, horaFormateada);
      console.log('Barberos con franjas disponibles:', barberosConFranjas.length);
      
      // 5. Filtrar barberos que NO tengan citas que se solapen
      const barberosDisponibles: any[] = [];

      for (const data of barberosConFranjas) {
        // data.barbero contiene el objeto User completo gracias al join en horarioBarberoService
        const barbero = data; // En este servicio, buscarporDiayHora devuelve barberos únicos directamente
        const barberoId = barbero.id;

        const tieneCitasSolapadas = await this.barberoTieneCitasSolapadas(
          barberoId,
          fecha,
          horaFormateada,
          horaFin
        );

        console.log(`Barbero ${barberoId} tiene citas solapadas:`, tieneCitasSolapadas);

        if (!tieneCitasSolapadas) {
          barberosDisponibles.push(barbero);
        }
      }

      console.log('Barberos disponibles finales:', barberosDisponibles.length);

      if (barberosDisponibles.length > 0) {
        return {
          disponible: true,
          barbero_id: barberosDisponibles[0].id,
          barberos_disponibles: barberosDisponibles,
          total_disponibles: barberosDisponibles.length
        };
      } else {
        return {
          disponible: false,
          barbero_id: null,
          mensaje: 'No hay barberos disponibles para esta fecha y hora',
          barberos_disponibles: [],
          total_disponibles: 0
        };
      }

    } catch (error) {
      console.error('Error en obtenerBarberosDisponiblesParaCita:', error);
      return {
        disponible: false,
        barbero_id: null,
        error: error.message,
        barberos_disponibles: [],
        total_disponibles: 0
      };
    }
  }

  // Detectar si el barbero trabaja en ese dia y hora
  private async barberoTrabajaEnDiaYHora(barberoId: number, diaSemana: DiaSemana, hora: string): Promise<boolean> {
    const horarios = await this.horarioBarberoService.buscarporDiayHora(diaSemana, hora);
    return horarios.some(horario => horario.id === barberoId);
  }

  sumTimes(timeStrings: string[]): string {
    let totalDuration = Duration.fromObject({ hours: 0, minutes: 0, seconds: 0 });

    for (const time of timeStrings) {
      const [hours, minutes, seconds] = time.split(':').map(Number);
      const duration = Duration.fromObject({ hours, minutes, seconds });
      totalDuration = totalDuration.plus(duration);
    }

    // Formatea el resultado como hh:mm:ss
    const hours = Math.floor(totalDuration.as('hours'));
    const minutes = totalDuration.minutes % 60;
    const seconds = totalDuration.seconds % 60;

    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Verifica si un barbero tiene citas que se solapen con el rango de tiempo dado
   * @param idBarbero - ID del barbero
   * @param fecha - Fecha a verificar
   * @param horaInicio - Hora de inicio del rango
   * @param horaFin - Hora de fin del rango
   * @returns true si hay solapamiento, false si no hay conflictos
   */
  private async barberoTieneCitasSolapadas(
    idBarbero: number,
    fecha: Date,
    horaInicio: string,
    horaFin: string
  ): Promise<boolean> {
    const citasDelDia = await this.citaRepository
      .createQueryBuilder('cita')
      .innerJoinAndSelect('cita.servicio', 'servicio')
      .where('cita.Id_RolBarbero = :idBarbero', { idBarbero })
      .andWhere('cita.fecha = :fecha', { fecha })
      .getMany();

    // Verificar si alguna cita existente se solapa con el nuevo rango
    for (const cita of citasDelDia) {
      const citaHoraInicio = cita.hora.toString();

      const times = [citaHoraInicio.toString(), cita.servicio.duracionAprox.toString()];
      const citaHoraFin = this.sumTimes(times); 

      //const citaHoraFin = this.sumarMinutosAHora(citaHoraInicio, cita.servicio.duracionAprox);

      if (this.verificarSolapamientoHorarios(horaInicio, horaFin, citaHoraInicio, citaHoraFin)) {
        return true; // Hay solapamiento
      }
    }
    return false; // No hay conflictos
  }

  /**
   * Verifica si dos rangos de tiempo se solapan
   * @param inicio1 - Hora de inicio del primer rango
   * @param fin1 - Hora de fin del primer rango
   * @param inicio2 - Hora de inicio del segundo rango
   * @param fin2 - Hora de fin del segundo rango
   * @returns true si hay solapamiento, false si no
   */
  private verificarSolapamientoHorarios(
    inicio1: string,
    fin1: string,
    inicio2: string,
    fin2: string
  ): boolean {
    // Convertir horas a minutos para facilitar la comparación
    const inicio1Min = this.horaAMinutos(inicio1);
    const fin1Min = this.horaAMinutos(fin1);
    const inicio2Min = this.horaAMinutos(inicio2);
    const fin2Min = this.horaAMinutos(fin2);

    // Verificar solapamiento con un margen de 10 minutos (BUFFER)
    // Se considera solapado si: (inicio1 < fin2 + 10) AND (inicio2 < fin1 + 10)
    const BUFFER = 10;
    return (inicio1Min < fin2Min + BUFFER) && (inicio2Min < fin1Min + BUFFER);
  }

  /**
   * Convierte una hora en formato HH:MM:SS a minutos desde las 00:00
   * @param hora - Hora en formato HH:MM:SS
   * @returns Número de minutos desde las 00:00
   */
  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Suma minutos a una hora y devuelve la nueva hora
   * @param hora - Hora inicial en formato HH:MM:SS
   * @param minutos - Minutos a sumar
   * @returns Nueva hora en formato HH:MM:SS
   */

  private sumarMinutosAHora(hora: string, minutos: number): string {
    const totalMinutos = this.horaAMinutos(hora) + minutos;
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    
    // Formatear con ceros a la izquierda
    const horasStr = horas.toString().padStart(2, '0');
    const minsStr = mins.toString().padStart(2, '0');
    
    return `${horasStr}:${minsStr}:00`;
  }

  /**
   * Extrae el día de la semana de una fecha
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Día de la semana como enum DiaSemana
   */
  private extraerDiaSemanaDelaFecha(fecha: Date): DiaSemana {
    const fechaObj = new Date(fecha + 'T00:00:00'); // Agregar tiempo para evitar problemas de zona horaria
    const numeroDia = fechaObj.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const mapeosDias: Record<number, DiaSemana> = {
      1: DiaSemana.LUNES,
      2: DiaSemana.MARTES,
      3: DiaSemana.MIERCOLES,
      4: DiaSemana.JUEVES,
      5: DiaSemana.VIERNES,
      6: DiaSemana.SABADO,
      0: DiaSemana.DOMINGO
    };

    return mapeosDias[numeroDia];
  }

    /**
   * Actualiza el estado de una cita
   * @param id - ID de la cita
   * @param updateEstadoDto - DTO con el nuevo estado
   * @returns Cita actualizada
   */
  async actualizarEstado(id: number, updateEstadoDto: UpdateEstadoCitaDto, user?: any) {
    const cita = await this.findOne(id);

    // 1. Validar propiedad (excepto Admin)
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (user.role === Role.BARBERO && cita.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para modificar esta cita');
      }
      if (user.role === Role.CLIENTE && cita.cliente.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para modificar esta cita');
      }
    }

    // 2. Validar que la cita esté en estado "agendada" para poder cancelarla
    if (updateEstadoDto.estado === 'cancelada' && cita.estado !== 'agendada') {
      throw new BadRequestException(
        'Solo se pueden cancelar citas con estado "agendada"'
      );
    }

    // 3. Validar tiempo de anticipación (solo para CLIENTE)
    if (updateEstadoDto.estado === 'cancelada' && user?.role === Role.CLIENTE) {
      const ahora = new Date();
      const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
      const diferenciaHoras = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      if (diferenciaHoras > 0 && diferenciaHoras < 2) {
        throw new ForbiddenException(
          'No se puede cancelar una cita con menos de 2 horas de anticipación. ' +
          'Por favor, contacta directamente con la barbería.'
        );
      }
    }

    // Actualizar el estado
    cita.estado = updateEstadoDto.estado;
    const citaActualizada = await this.citaRepository.save(cita);

    return {
      success: true,
      mensaje: `Cita ${updateEstadoDto.estado} exitosamente`,
      cita: citaActualizada
    };
  }

  /**
   * Cancelar una cita (método conveniente)
   * @param id - ID de la cita
   * @returns Cita cancelada
   */
  async cancelarCita(id: number, user?: any) {
    return this.actualizarEstado(id, { estado: EstadoCita.CANCELADA }, user);
  }

  /**
   * Completar una cita (método conveniente para barberos/admin)
   * @param id - ID de la cita
   * @returns Cita completada
   */
  async completarCita(id: number, user?: any) {
    const cita = await this.findOne(id);
    
    // Validar que la cita esté agendada
    if (cita.estado !== 'agendada') {
      throw new BadRequestException(
        'Solo se pueden completar citas con estado "agendada"'
      );
    }

    return this.actualizarEstado(id, { estado: EstadoCita.COMPLETADA }, user);
  }

  /**
 * Obtiene las horas ocupadas de un barbero en una fecha específica
 * @param barberoId - ID del barbero
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns Array de horas ocupadas con sus rangos
 */
  async obtenerHorasOcupadasBarbero(barberoId: number, fecha: string) {
      try {
      // Obtener todas las citas del barbero en esa fecha
      const citas = await this.citaRepository
        .createQueryBuilder('cita')
        .innerJoinAndSelect('cita.servicio', 'servicio')
        .where('cita.Id_RolBarbero = :barberoId', { barberoId })
        .andWhere('cita.fecha = :fecha', { fecha })
        .andWhere('cita.estado != :estadoCancelada', { estadoCancelada: 'cancelada' }) // Excluir canceladas
        .getMany();

      const horasOcupadas = citas.map(cita => {
        const hora_inicio = cita.hora.toString();
        const hora_fin = this.sumTimes([hora_inicio, cita.servicio.duracionAprox.toString()]);
        
        return {
          hora_inicio,
          hora_fin,
          citaId: cita.id_cita
        };
      });

      return {
        barberoId,
        fecha,
        horasOcupadas,
        totalCitas: horasOcupadas.length
      };
    } catch (error) {
      console.error('Error al obtener horas ocupadas:', error);
      throw new BadRequestException('Error al consultar disponibilidad del barbero');
    }
  }

  async findAll(user: any) {
    const { role, id: userId } = user;

    if (role === Role.ADMINISTRADOR) {
      return await this.citaRepository.find({ relations: ['cliente', 'barbero', 'servicio'] });
    }

    if (role === Role.BARBERO) {
      return await this.citaRepository.find({
        where: { barbero: { id: userId } },
        relations: ['cliente', 'barbero', 'servicio']
      });
    }

    // Si es CLIENTE, solo sus propias citas
    return await this.citaRepository.find({
      where: { cliente: { id: userId } },
      relations: ['cliente', 'barbero', 'servicio']
    });
  }

  async findOne(id: number, user?: any): Promise<Cita> {
    const cita = await this.citaRepository.findOne({ 
      where: { id_cita: id }, 
      relations: ['cliente', 'barbero', 'servicio'] 
    });
    
    if (!cita) {
      throw new BadRequestException(`Cita con id ${id} no encontrada`);
    }

    // Si hay un usuario, validar propiedad (excepto admin)
    if (user && user.role !== Role.ADMINISTRADOR) {
      if (user.role === Role.BARBERO && cita.barbero.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para acceder a esta cita');
      }
      if (user.role === Role.CLIENTE && cita.cliente.id !== user.id) {
        throw new ForbiddenException('No tienes permiso para acceder a esta cita');
      }
    }

    return cita;
  }

  update(id: number, updateCitaDto: UpdateCitaDto) {
    return `This action updates a #${id} cita`;
  }

  async remove(id: number) {
    const cita = await this.findOne(id);
    await this.citaRepository.remove(cita);
    return `Cita con id ${id} eliminada correctamente`;
  }
}
