import { Injectable } from '@nestjs/common';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Servicio } from 'src/servicio/entities/servicio.entity';
import { Repository } from 'typeorm';
import { DiaSemana, HorarioBarbero } from 'src/horario-barbero/entities/horario-barbero.entity';
import { HorarioBarberoService } from 'src/horario-barbero/horario-barbero.service';
import { Cita } from './entities/cita.entity';
import { Duration } from 'luxon';
@Injectable()
export class CitaService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,

    @InjectRepository(Cita)
    private readonly citaRepository: Repository<Cita>,

    private readonly horarioBarberoService: HorarioBarberoService,
  ) {}

  create(createCitaDto: CreateCitaDto) {
    return 'This action adds a new cita';
  }

  async obtenerBarberosDisponiblesParaCita(fecha: string, hora: string, idServicio: number) {
  try {
    console.log('=== DEBUG OBTENER BARBEROS DISPONIBLES ===');
    console.log('Parámetros recibidos:', { fecha, hora, idServicio });

    // 1. Extraer día de la semana de la fecha
    const diaSemana = this.extraerDiaSemanaDelaFecha(fecha);
    console.log('Día de la semana calculado:', diaSemana);
    
    // 2. Obtener duración del servicio
    const servicio = await this.servicioRepository.findOne({ where: { id: idServicio } });
    if (!servicio) {
      console.log(`Servicio con ID ${idServicio} no encontrado`);
      throw new Error(`Servicio con ID ${idServicio} no encontrado`);
    }
    console.log('Servicio encontrado:', servicio);

    // 3. Calcular rango de tiempo que ocuparía la nueva cita
    const horaFormateada = hora;
    const times = [hora.toString(), servicio.duracionAprox.toString()];
    const horaFin = this.sumTimes(times); 
    console.log('Hora inicio:', horaFormateada, 'Hora fin:', horaFin);

    // 4. Obtener barberos que tienen franjas disponibles para este día y hora
    const barberosConFranjas = await this.horarioBarberoService.buscarporDiayHora(diaSemana, horaFormateada);
    console.log('Barberos con franjas disponibles:', barberosConFranjas);
    
    // 5. Filtrar barberos que NO tengan citas que se solapen
    const barberosDisponibles: number[] = [];

    for (const data of barberosConFranjas) {
      console.log('Verificando barbero:', data);

      // CORRECCIÓN: Usar Id_RolBarbero en lugar de id
      const barberoId = data.Id_RolBarbero || data.id; // Soporte para ambos formatos
      console.log('ID del barbero extraído:', barberoId);

      const tieneCitasSolapadas = await this.barberoTieneCitasSolapadas(
        barberoId,
        fecha,
        horaFormateada,
        horaFin
      );

      console.log(`Barbero ${barberoId} tiene citas solapadas:`, tieneCitasSolapadas);

      if (!tieneCitasSolapadas) {
        barberosDisponibles.push(barberoId);
      }
    }

    console.log('Barberos disponibles finales:', barberosDisponibles);

    // CAMBIO PRINCIPAL: Retornar el objeto con el formato esperado
    if (barberosDisponibles.length > 0) {
      return {
        disponible: true,
        barbero_id: barberosDisponibles[0], // Primer barbero disponible
        barberos_disponibles: barberosDisponibles, // Todos los barberos disponibles
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
    fecha: string,
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

    // Verificar solapamiento: (inicio1 < fin2) AND (inicio2 < fin1)
    return (inicio1Min < fin2Min) && (inicio2Min < fin1Min);
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
  private extraerDiaSemanaDelaFecha(fecha: string): DiaSemana {
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

  findAll() {
    return `This action returns all cita`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cita`;
  }

  update(id: number, updateCitaDto: UpdateCitaDto) {
    return `This action updates a #${id} cita`;
  }

  remove(id: number) {
    return `This action removes a #${id} cita`;
  }

  
}
