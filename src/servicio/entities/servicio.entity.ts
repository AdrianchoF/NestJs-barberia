import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Servicio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column('text')
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column({ type: 'time' })
    duracionAprox: number;
}
