import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

export enum DiaSemana {
    LUNES = 'lunes',
    MARTES = 'martes',
    MIERCOLES = 'miercoles',
    JUEVES = 'jueves',
    VIERNES = 'viernes',
    SABADO = 'sabado',
    DOMINGO = 'domingo'
}

export interface PausaBarbero {
    id: string; // UUID para identificar
    tipo: 'recurrente' | 'ocasional';
    fecha?: string; // YYYY-MM-DD, solo para ocasional
    hora_inicio: string; // HH:MM
    hora_fin: string; // HH:MM
    motivo: string;
    todos_los_dias?: boolean; // Solo para recurrente
}

@Entity()
export class HorarioBarbero {
    @PrimaryGeneratedColumn({ name: 'Id_HorarioBarbero' })
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolBarbero' })
    barbero: User;

    @Column({
        type: 'enum',
        enum: DiaSemana,
        default: DiaSemana.LUNES
    })
    Dia_semana: DiaSemana;

    @Column({ type: 'time' })
    hora_inicio: string;

    @Column({ type: 'time' })
    hora_fin: string;

    @Column({ type: 'json', nullable: true })
    pausas: PausaBarbero[];
}
