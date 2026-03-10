import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { Configuracion } from './entities/configuracion.entity';
// Asegúrate de importar JwtAuthGuard o similar si ya existe en tu proyecto para proteger el PATCH
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('configuracion')
export class ConfiguracionController {
    constructor(private readonly configuracionService: ConfiguracionService) { }

    @Get()
    getConfig() {
        return this.configuracionService.getConfig();
    }

    // El guard se puede añadir después si es necesario
    @Patch()
    updateConfig(@Body() updateDto: Partial<Configuracion>) {
        return this.configuracionService.updateConfig(updateDto);
    }
}
