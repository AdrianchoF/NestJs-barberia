import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, Role } from '../auth/entities/user.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Producto } from '../producto/entities/producto.entity';

@Injectable()
export class GlobalSearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async search(query: string, userRole: string) {
    if (!query || query.length < 2) {
      return { users: [], services: [], products: [] };
    }

    const searchResults: any = {
      users: [],
      services: [],
      products: []
    };
    const normalizedRole = (userRole || '').toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 1. Search Services (Available for everyone)
    searchResults.services = await this.servicioRepository.find({
      where: [
        { nombre: Like(`%${query}%`) },
        { descripcion: Like(`%${query}%`) }
      ],
      take: 5,
      relations: ['categoria']
    });

    // 2. Role-based search
    if (normalizedRole === Role.ADMINISTRADOR) {
      // Admin searches everything
      searchResults.users = await this.userRepository.find({
        where: [
          { nombre: Like(`%${query}%`) },
          { apellido: Like(`%${query}%`) },
          { email: Like(`%${query}%`) }
        ],
        take: 5
      });

      searchResults.products = await this.productoRepository.find({
        where: [
          { nombre: Like(`%${query}%`) },
          { descripcion: Like(`%${query}%`) }
        ],
        take: 5,
        relations: ['categoria']
      });
    } else if (normalizedRole === Role.BARBERO) {
      // Barbero searches clients and products
      searchResults.users = await this.userRepository.find({
        where: [
          { nombre: Like(`%${query}%`), role: Role.CLIENTE },
          { apellido: Like(`%${query}%`), role: Role.CLIENTE }
        ],
        take: 5
      });

      searchResults.products = await this.productoRepository.find({
        where: [
          { nombre: Like(`%${query}%`) },
          { descripcion: Like(`%${query}%`) }
        ],
        take: 5,
        relations: ['categoria']
      });
    } else {
      // Cliente searches barbers
      searchResults.users = await this.userRepository.find({
        where: [
          { nombre: Like(`%${query}%`), role: Role.BARBERO },
          { apellido: Like(`%${query}%`), role: Role.BARBERO }
        ],
        take: 5
      });
    }

    return searchResults;
  }
}
