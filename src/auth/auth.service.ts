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
import { MailService } from 'src/mail/mail.service';

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
  async update(id: number, updateDto: any) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Extraer campos especiales
    const { email, password, horarios, ...rest } = updateDto;

    // 1. Validar unicidad del email si cambia
    if (email && email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('Este email ya está en uso por otro usuario');
      }
      user.email = email;
    }

    // 2. Hashear nueva contraseña si se proporciona
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    // 3. Actualizar el resto de campos (nombre, apellido, telefono, foto, role, activo, etc.)
    Object.assign(user, rest);

    // 4. Guardar cambios básicos del usuario
    const savedUser = await this.usersRepository.save(user);

    // 5. Manejar actualización de horarios si es barbero y vienen en el DTO
    if (horarios && Array.isArray(horarios) && savedUser.role === Role.BARBERO) {
      try {
        // Eliminar horarios anteriores para este barbero
        await this.horarioBarberoRepository.delete({ barbero: { id: savedUser.id } });

        const horariosGuardados: HorarioBarbero[] = [];
        for (const h of horarios) {
          const nuevoHorario = this.horarioBarberoRepository.create({
            barbero: savedUser,
            Dia_semana: h.diasemana as any,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
          });
          horariosGuardados.push(await this.horarioBarberoRepository.save(nuevoHorario));
        }

        return {
          user: savedUser,
          horarios: horariosGuardados,
          message: 'Barbero y horarios actualizados exitosamente',
        };
      } catch (error) {
        console.error('Error al actualizar horarios:', error);
        throw new BadRequestException('Error al actualizar los horarios: ' + error.message);
      }
    }

    // Si el usuario acaba de ser penalizado (activo paso a false y hay motivo/fecha)
    if (updateDto.activo === false && updateDto.motivoPenalizacion) {
      await this.mailService.sendPenaltyNotification(
        savedUser.email,
        savedUser.nombre,
        updateDto.motivoPenalizacion,
        updateDto.penalizadoHasta
      );
    }

    return {
      user: savedUser,
      message: 'Usuario actualizado exitosamente',
    };
  }
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(HorarioBarbero)
    private readonly horarioBarberoRepository: Repository<HorarioBarbero>,
    private readonly mailService: MailService,
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

    // === PROGRAMAR AUTO-REACTIVACIÓN Y CONTROL DE PENALIZACIÓN ===
    if (user.activo === false) {
      const now = new Date();
      if (user.penalizadoHasta && new Date(user.penalizadoHasta) <= now) {
        // La penalización ya expiró, reactivamos automáticamente
        user.activo = true;
        user.penalizadoHasta = undefined;
        user.motivoPenalizacion = undefined;
        await this.usersRepository.save(user);
        // Continuamos con el login normalmente
      } else {
        // Sigue penalizado o desactivado manualmente sin fecha definida
        let errorMessage = 'Tu cuenta ha sido desactivada. Por favor, contacta al administrador.';
        if (user.motivoPenalizacion) {
          const dateStr = user.penalizadoHasta 
            ? new Date(user.penalizadoHasta).toLocaleString() 
            : 'indefinidamente';
          errorMessage = `Cuenta suspendida hasta ${dateStr}. Motivo: ${user.motivoPenalizacion}`;
        }
        throw new UnauthorizedException(errorMessage);
      }
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

  async findAllBarberos(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { role: Role.BARBERO, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findAllBarberosAdmin(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { role: Role.BARBERO },
      order: { nombre: 'ASC' },
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

  async loginWithGoogle(profile: any) {
    const { email, firstName, lastName, picture } = profile;

    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // Si el usuario no existe, lo creamos
      // Generamos una contraseña aleatoria ya que es obligatoria en la bd para este esquema
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

      user = this.usersRepository.create({
        email,
        nombre: firstName,
        apellido: lastName,
        password: randomPassword,
        foto: picture,
        // telefono: '', // Ya es nullable
        role: Role.CLIENTE,
        activo: true,
      });

      user = await this.usersRepository.save(user);
    }

    // === PROGRAMAR AUTO-REACTIVACIÓN Y CONTROL DE PENALIZACIÓN ===
    if (user.activo === false) {
      const now = new Date();
      if (user.penalizadoHasta && new Date(user.penalizadoHasta) <= now) {
        user.activo = true;
        user.penalizadoHasta = undefined;
        user.motivoPenalizacion = undefined;
        await this.usersRepository.save(user);
      } else {
        let errorMessage = 'Tu cuenta ha sido desactivada.';
        if (user.motivoPenalizacion) {
          const dateStr = user.penalizadoHasta 
            ? new Date(user.penalizadoHasta).toLocaleString() 
            : 'indefinidamente';
          errorMessage = `Cuenta suspendida hasta ${dateStr}. Motivo: ${user.motivoPenalizacion}`;
        }
        throw new UnauthorizedException(errorMessage);
      }
    }

    // Generamos el token local
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
}
