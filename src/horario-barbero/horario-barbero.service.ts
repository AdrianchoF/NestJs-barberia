import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioBarbero } from './entities/horario-barbero.entity';
import { CreateHorarioBarberoDto } from './dto/create-horario-barbero.dto';
//import { UpdateHorarioBarberoDto } from './dto/update-horario-barbero.dto';
import { User } from 'src/auth/entities/user.entity';
import { Role } from 'src/auth/entities/user.entity';

@Injectable()
export class HorarioBarberoService {
  constructor(
    @InjectRepository(HorarioBarbero)
    private readonly horarioRepository: Repository<HorarioBarbero>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async create(dto: CreateHorarioBarberoDto) {
    const barbero = await this.userRepository.findOne({
      where: { id: dto.barberoId },
    });

    if (!barbero) {
      throw new BadRequestException('El barbero no existe');
    }

    if (barbero.role !== Role.BARBERO) {
      throw new BadRequestException('El usuario no tiene rol de barbero');
    }

    // ✅ Validar que horaInicio < horaFin
    const convertirHoraAMinutos = (hora: string): number => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicio = convertirHoraAMinutos(dto.horaInicio);
    const fin = convertirHoraAMinutos(dto.horaFin);

    if (inicio >= fin) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

    const horario = this.horarioRepository.create({
      ...dto,
      barbero,
    });

    return this.horarioRepository.save(horario);
  }

  findAll() {
    return `This action returns all horarioBarbero`;
  }

  findOne(id: number) {
    return `This action returns a #${id} horarioBarbero`;
  }

  /* update(id: number, updateHorarioBarberoDto: UpdateHorarioBarberoDto) {
    return `This action updates a #${id} horarioBarbero`;
  } */

  remove(id: number) {
    return `This action removes a #${id} horarioBarbero`;
  }
}
