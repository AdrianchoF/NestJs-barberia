import { Controller, Get, Patch, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CintaPromocionalService } from './cinta-promocional.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cintas-promocionales')
export class CintaPromocionalController {
  constructor(private readonly cintaService: CintaPromocionalService) { }

  @Public()
  @Get()
  findAll() {
    return this.cintaService.findAll();
  }

  @Public()
  @Get(':ubicacion')
  findByUbicacion(@Param('ubicacion') ubicacion: string) {
    return this.cintaService.findByUbicacion(ubicacion);
  }

  @Roles(Role.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.cintaService.update(id, updateDto);
  }
}
