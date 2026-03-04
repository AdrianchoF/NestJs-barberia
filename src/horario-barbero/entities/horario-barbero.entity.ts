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
}
