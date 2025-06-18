import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from 'src/clientes/entities/cliente.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterAuthDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const nuevo = this.clienteRepository.create({ ...dto, password: hash });
    const cliente = await this.clienteRepository.save(nuevo);
    delete cliente.password;
    return cliente;
  }

  async login(dto: LoginAuthDto) {
    const cliente = await this.clienteRepository.findOneBy({ email: dto.email });
    if (!cliente) throw new UnauthorizedException('Usuario no encontrado');

    const match = await bcrypt.compare(dto.password, cliente.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { id: cliente.id, email: cliente.email };
    const token = this.jwtService.sign(payload);
    return { token, cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email } };
  }
}
