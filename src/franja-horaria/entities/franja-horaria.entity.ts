import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('franja-horaria')
export class FranjaHoraria {
    @PrimaryGeneratedColumn()
    id_franja: number;

    @Column({ type: 'time' })
    hora_inicio: string;

    @Column({ type: 'time' })
    hora_fin: string;
}