import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CintaPromocional } from './entities/cinta-promocional.entity';

@Injectable()
export class CintaPromocionalService {
    constructor(
        @InjectRepository(CintaPromocional)
        private readonly cintaRepository: Repository<CintaPromocional>,
    ) { }

    async findAll() {
        return await this.cintaRepository.find();
    }

    async findByUbicacion(ubicacion: string) {
        const cinta = await this.cintaRepository.findOne({ where: { ubicacion } });
        if (!cinta) throw new NotFoundException(`Cinta en ${ubicacion} no encontrada`);
        return cinta;
    }

    async update(id: number, updateDto: Partial<CintaPromocional>) {
        const cinta = await this.cintaRepository.findOne({ where: { id } });
        if (!cinta) throw new NotFoundException(`Cinta con ID ${id} no encontrada`);

        Object.assign(cinta, updateDto);
        return await this.cintaRepository.save(cinta);
    }

    // Método para inicializar si no existen
    async onModuleInit() {
        const count = await this.cintaRepository.count();
        if (count === 0) {
            await this.cintaRepository.save([
                {
                    ubicacion: 'servicios',
                    texto: '💈🔥 RECUERDA TODOS NUESTROS MIERCOLES DE CANDELA, CON TODA LA BARBERIA EN UN 20% DE DESCUENTO 💈🔥 | VEN Y DISFRUTA DE NUESTRO ESPACIO DE DISTRACCION CON NUESTRAS CONSOLAS DE VIDEOJUEGOS 🎮 | FINES DE SEMANA SERVICIO ESTANDAR CON GRANIZADO GRATIS 🥤'
                },
                {
                    ubicacion: 'productos',
                    texto: '👉🏻 POR LA COMPRA DE MAS DE 3 PRODUCTOS DE NUESTRA SECCION OBTEN UN 10% EN EL TOTAL DE LA COMPRA 🤑🚨'
                }
            ]);
        }
    }
}
