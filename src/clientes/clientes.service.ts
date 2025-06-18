// src/clientes/clientes.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    // Verificar si el email ya existe
    const existeEmail = await this.clienteRepository.findOne({
      where: { email: createClienteDto.email },
    });

    if (existeEmail) {
      throw new ConflictException('Ya existe un cliente con este email');
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return await this.clienteRepository.save(cliente); 
  }

  async findAll(): Promise<Cliente[]> {
    return await this.clienteRepository.find({
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);

    // Si se está actualizando el email, verificar que no exista
    if (updateClienteDto.email && updateClienteDto.email !== cliente.email) {
      const existeEmail = await this.clienteRepository.findOne({
        where: { email: updateClienteDto.email },
      });

      if (existeEmail) {
        throw new ConflictException('Ya existe un cliente con este email');
      }
    }

    Object.assign(cliente, updateClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  async remove(id: number) {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
  }

  async findByEmail(email: string) {
    return await this.clienteRepository.findOne({
      where: { email },
    });
  }

  async findActivos(): Promise<Cliente[]> {
    return await this.clienteRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }
}
