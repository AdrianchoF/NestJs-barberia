import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('dia-semana')
export class DiaSemana {
    @PrimaryGeneratedColumn()
    id_dia: number;

    @Column({ type: 'varchar', length: 50 })
    nombre_dia: string;
}