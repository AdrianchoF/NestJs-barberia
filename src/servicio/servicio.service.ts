import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from "./entities/servicio.entity";
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(createServicioDto: CreateServicioDto): Promise<Servicio> {
    const dto = {
      ...createServicioDto,
      duracionAprox: createServicioDto.duracionAprox, // keep as string
    };
    const nuevoServicio = this.servicioRepository.create(dto);
    return await this.servicioRepository.save(nuevoServicio);
  }

  async findAll(): Promise<Servicio[]> {
    return await this.servicioRepository.find()
  }

  async findOne(id: number) {
    const servicio = await this.servicioRepository.findOne({
      where : { id },
    })

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return servicio
  }

  /* update(id: number, updateServicioDto: UpdateServicioDto) {
    return `This action updates a #${id} servicio`;
  } */

  async remove(id: number) {
    const servicio = await this.findOne(id);
    await this.servicioRepository.remove(servicio)
    return `Servicio con id ${id} eliminado correctamente`;
  }
}
