import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CintaPromocional } from './entities/cinta-promocional.entity';
import { CintaPromocionalService } from './cinta-promocional.service';
import { CintaPromocionalController } from './cinta-promocional.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CintaPromocional])],
    providers: [CintaPromocionalService],
    controllers: [CintaPromocionalController],
    exports: [CintaPromocionalService],
})
export class CintaPromocionalModule { }
