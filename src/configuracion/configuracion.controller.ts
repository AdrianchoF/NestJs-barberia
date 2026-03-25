import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { Configuracion } from './entities/configuracion.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) { }

  @Public()
  @Get()
  getConfig() {
    return this.configuracionService.getConfig();
  }

  @Roles(Role.ADMINISTRADOR)
  @Patch()
  updateConfig(@Body() updateDto: Partial<Configuracion>) {
    return this.configuracionService.updateConfig(updateDto);
  }
}
