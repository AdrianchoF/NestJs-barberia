import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { HorarioBarbero } from 'src/horario-barbero/entities/horario-barbero.entity';
import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioDto {
  @IsNotEmpty()
  @IsString()
  diasemana: string;

  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @IsNotEmpty()
  @IsString()
  hora_fin: string;
}

export class CreateBarberWithScheduleDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  apellido: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 100)
  password: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDto)
  horarios?: HorarioDto[];
}

@Injectable()
export class AuthService {
  update(id: number, updateDto: any) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(HorarioBarbero)
    private readonly horarioBarberoRepository: Repository<HorarioBarbero>,
    private jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, nombre, apellido, telefono, foto, role } = registerDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Este Email ya existe');
    }

    const users = await this.usersRepository.find();

    for (const user of users) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        throw new BadRequestException('Esta contraseña ya está en uso por otro usuario, por favor elija otra');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      nombre,
      apellido,
      telefono,
      foto,
      role,
      activo: true
    });

    return await this.usersRepository.save(user);
  }

  async registerBarberWithSchedule(
    createBarberWithScheduleDto: CreateBarberWithScheduleDto,
  ) {
    const { horarios, email, password, nombre, apellido, telefono, foto } = createBarberWithScheduleDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Este Email ya existe');
    }

    const users = await this.usersRepository.find();

    for (const user of users) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        throw new BadRequestException('Esta contraseña ya está en uso por otro usuario, por favor elija otra');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const barber = this.usersRepository.create({
      email,
      password: hashedPassword,
      nombre,
      apellido,
      telefono,
      foto,
      role: Role.BARBERO,
      activo: true
    });

    const savedBarber = await this.usersRepository.save(barber);

    // Crear horarios para el barbero
    if (horarios && horarios.length > 0) {
      try {
        const horariosGuardados: HorarioBarbero[] = [];

        for (const horario of horarios) {
          // Crear el horario con los datos locales
          const nuevoHorario = this.horarioBarberoRepository.create({
            barbero: savedBarber,
            Dia_semana: horario.diasemana as any,
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
          });

          const horarioGuardado = await this.horarioBarberoRepository.save(
            nuevoHorario,
          );
          horariosGuardados.push(horarioGuardado);
        }

        return {
          barbero: savedBarber,
          horarios: horariosGuardados,
          message: 'Barbero y horarios creados exitosamente',
        };
      } catch (error) {
        console.error('Error al crear horarios:', error);
        throw new BadRequestException(
          'Error al crear los horarios del barbero: ' + error.message,
        );
      }
    }

    return {
      barbero: savedBarber,
      horarios: [],
      message: 'Barbero creado exitosamente sin horarios',
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Payload del token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        Role: user.role,
      },
    };
  }

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

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    return `Usuario con id ${id} eliminado satisfactoriamente`;
  }

  async findUserById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }
}