import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioBarbero } from './entities/horario-barbero.entity';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
//import { UpdateHorarioBarberoDto } from './dto/update-horario-barbero.dto';
import { User } from 'src/auth/entities/user.entity';
import { Role } from 'src/auth/entities/user.entity';
import { DiaSemana } from 'src/dia-semana/entities/dia-semana.entity';
import { FranjaHoraria } from 'src/franja-horaria/entities/franja-horaria.entity';

@Injectable()
export class HorarioBarberoService {
  constructor(
    @InjectRepository(HorarioBarbero)
    private readonly horarioRepository: Repository<HorarioBarbero>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(DiaSemana)
    private readonly diaSemanaRepository: Repository<DiaSemana>,

    @InjectRepository(FranjaHoraria)
    private readonly franjaHorariaRepository: Repository<FranjaHoraria>
  ) {}

  async create(dto: CreateHorarioBarberoDto) {
    const { barberoId, idDia, idFranja } = dto;

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

    // Buscar y asignar la entidad DiaSemana
    const dia = await this.diaSemanaRepository.findOne({ where: { id_dia: idDia } });
    if (!dia) {
      throw new BadRequestException('El dia no existe')
    }

    // Buscar y asignar la entidad FranjaHoraria
    const franja = await this.franjaHorariaRepository.findOne({ where: { id_franja: idFranja } });
    if (!franja) {
      throw new BadRequestException('La franja horaria no existe');
    }

    // Verificar solapamiento de franjas horarias para el mismo barbero y dia
    const existingHorarios = await this.horarioRepository.find({
      where: { barbero: { id: barberoId }, dia: { id_dia: idDia } },
      relations: ['franja']
    });

    const newFranjaInicio = new Date(`1970-01-01 ${franja.hora_inicio}`);
    const newFranjaFin = new Date(`1970-01-01 ${franja.hora_fin}`);

    for (const existingHorario of existingHorarios) {
      const existingFranjaInicio = new Date(`1970-01-01 ${existingHorario.franja.hora_inicio}`);
      const existingFranjaFin = new Date(`1970-01-01 ${existingHorario.franja.hora_fin}`);

      if (
        (newFranjaInicio < existingFranjaFin && newFranjaFin > existingFranjaInicio) ||
        (existingFranjaInicio < newFranjaFin && existingFranjaFin > newFranjaInicio)
      ) {
        throw new BadRequestException('La nueva franja horaria se cruza con un horario ya creado para este barbero')
      }
    }

    // Verificar horarios duplicados
    const existingHorario = await this.horarioRepository.findOne({
      where: { barbero: { id: barberoId }, dia: { id_dia: idDia }, franja: { id_franja: idFranja } }
    });
    if (existingHorario) {
      throw new BadRequestException('Este horario ya esta registrado para este barbero');
    }

    // Crear y guardar el horario con las entidades relacionadas
    const horario = this.horarioRepository.create({
      barbero,
      dia,
      franja
    });
    
    return await this.horarioRepository.save(horario);
  }

  async findAll() {
    return await this.horarioRepository.find({
      relations: ['barbero', 'dia', 'franja'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id },
      relations: ['barbero', 'dia', 'franja'],
    });
    if (!horario) {
      throw new BadRequestException(`Horario con ID ${id} no encontrado`);
    }
    return horario;
  }

  /* update(id: number, updateHorarioBarberoDto: UpdateHorarioBarberoDto) {
    return `This action updates a #${id} horarioBarbero`;
  } */

  async remove(id: number) {
    const horario = await this.findOne(id);
    await this.horarioRepository.remove(horario);
    return { message: `Horario con ID ${id} eliminado correctamente` };
  }
}
