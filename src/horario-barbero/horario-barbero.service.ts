import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiaSemana, HorarioBarbero } from './entities/horario-barbero.entity';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
import { User, Role } from 'src/auth/entities/user.entity';

@Injectable()
export class HorarioBarberoService {
  constructor(
    @InjectRepository(HorarioBarbero)
    private readonly horarioRepository: Repository<HorarioBarbero>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

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

    if (barbero.role !== Role.BARBERO) {
      throw new BadRequestException('El usuario no tiene rol de barbero');
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
      throw new BadRequestException(`No se encontraron horarios para el barbero con ID ${barberoId}`);
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
}