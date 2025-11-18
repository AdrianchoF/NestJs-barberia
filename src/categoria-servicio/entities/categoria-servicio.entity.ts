import { Servicio } from "src/servicio/entities/servicio.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CategoriaServicio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    nombre: string;

    @OneToMany(() => Servicio, (servicio) => servicio.categoria)
    servicios: Servicio[];
}