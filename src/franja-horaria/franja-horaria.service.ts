import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
import { UpdateFranjaHorariaDto } from './dto/update-franja-horaria.dto';

@Injectable()
export class FranjaHorariaService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaHorariaRepository: Repository<FranjaHoraria>,
  ) {}

  async create(createFranjaHorariaDto: CreateFranjaHorariaDto) {
    const { hora_inicio, hora_fin } = createFranjaHorariaDto;

    const convertirHoraAMinutos = (hora: string): number => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const inicio = convertirHoraAMinutos(hora_inicio);
    const fin = convertirHoraAMinutos(hora_fin);

    if (inicio >= fin) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

    const existingFranja = await this.franjaHorariaRepository.findOne({
      where: { hora_inicio, hora_fin },
    });
    if (existingFranja) {
      throw new BadRequestException('Esta franja horaria ya existe');
    }

    const franja = this.franjaHorariaRepository.create({ hora_inicio, hora_fin });
    return await this.franjaHorariaRepository.save(franja);
  }

  async findAll() {
    return await this.franjaHorariaRepository.find({ order: { hora_inicio: 'ASC' } });
  }

  async findOne(id: number) {
    const franja = await this.franjaHorariaRepository.findOne({ where: { id_franja: id } });
    if (!franja) {
      throw new BadRequestException(`Franja horaria con ID ${id} no encontrada`);
    }
    return franja;
  }

  async update(id: number, updateFranjaHorariaDto: UpdateFranjaHorariaDto) {
    const franja = await this.findOne(id);
    const updatedFranja = this.franjaHorariaRepository.merge(franja, updateFranjaHorariaDto);
    return await this.franjaHorariaRepository.save(updatedFranja);
  }

  async remove(id: number) {
    const franja = await this.findOne(id);
    await this.franjaHorariaRepository.remove(franja);
    return { message: `Franja horaria con ID ${id} eliminada correctamente` };
  }
}