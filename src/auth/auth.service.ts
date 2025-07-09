import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
//import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, nombre, apellido, telefono, role } = registerDto;
    
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Este Email ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      nombre,
      apellido,
      telefono,
      role,
      activo: true
    });

    return await this.usersRepository.save(user);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  /* async create(CreateUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existeEmail = await this.usersRepository.findOne({
      where: { email: CreateUserDto.email },
    });
  
    if (existeEmail) {
      throw new ConflictException('Ya existe un cliente con este email');
    }
  
    const user = this.usersRepository.create({
      ...CreateUserDto,
      telefono: CreateUserDto.telefono ? String(CreateUserDto.telefono): undefined,
    });
    return await this.usersRepository.save(user); 
  } */

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const cliente = await this.usersRepository.findOne({
      where: { id },
    });
  
    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
  
    return cliente;
  }

  /* async update(id: number, updateClienteDto: UpdateClienteDto): Promise<User> {
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
  } */

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return `Usuario con id ${id} eliminado satisfactoriamente`;
  }

  /* async findByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }
  
  async findActivos(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  } */

  async findUserById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }
}
