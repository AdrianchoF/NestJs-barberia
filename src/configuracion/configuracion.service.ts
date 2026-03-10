import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from './entities/configuracion.entity';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
    constructor(
        @InjectRepository(Configuracion)
        private readonly configRepository: Repository<Configuracion>,
    ) { }

    async getConfig() {
        let config = await this.configRepository.findOne({ where: { id: 1 } });
        if (!config) {
            // Si por alguna razón no existe el ID 1, devolvemos el primero que encontremos
            config = await this.configRepository.findOne({ where: {} });
        }
        return config;
    }

    async updateConfig(updateDto: Partial<Configuracion>) {
        let config = await this.getConfig();
        if (!config) {
            config = this.configRepository.create(updateDto);
        } else {
            Object.assign(config, updateDto);
        }
        config.updatedAt = new Date();
        return await this.configRepository.save(config);
    }

    async onModuleInit() {
        const count = await this.configRepository.count();
        if (count === 0) {
            await this.configRepository.save({
                id: 1,
                nombre: 'StyleHub Barber Shop',
                direccion: 'Calle 123 #45-67, Bogotá, Colombia',
                latitud: 8.752611,
                longitud: -75.884609,
                telefono: '+57 300 123 4567',
                whatsapp: '573001234567',
                instagram: 'https://instagram.com/stylehub',
                facebook: 'https://facebook.com/stylehub',
                tiktok: 'https://tiktok.com/@stylehub',
                horarios: 'Lunes a Viernes: 9am - 8pm | Sábados: 9am - 9pm | Domingos: Cerrado'
            });
            console.log('✅ Configuración inicial de la barbería creada.');
        }
    }
}
