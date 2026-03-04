import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CintaPromocionalService } from './cinta-promocional.service';

@Controller('cintas-promocionales')
export class CintaPromocionalController {
    constructor(private readonly cintaService: CintaPromocionalService) { }

    @Get()
    findAll() {
        return this.cintaService.findAll();
    }

    @Get(':ubicacion')
    findByUbicacion(@Param('ubicacion') ubicacion: string) {
        return this.cintaService.findByUbicacion(ubicacion);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
        return this.cintaService.update(id, updateDto);
    }
}
