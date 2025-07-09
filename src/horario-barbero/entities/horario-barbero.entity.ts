import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';

export enum DiaSemana {
    LUNES = 'lunes',
    MARTES = 'martes',
    MIERCOLES = 'miercoles',
    JUEVES = 'jueves',
    VIERNES = 'viernes',
    SABADO = 'sabado',
    DOMINGO = 'domingo',
}

@Entity()
export class HorarioBarbero {
    @PrimaryGeneratedColumn({ name : 'Id_HorarioBarbero' })
    id: number;

    @Column('simple-array')
    diasSemana: string[];

    @Column({ type: 'time', name: 'HoraInicio' })
    horaInicio: string;

    @Column({ type: 'time', name: 'HoraFin' })
    horaFin: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolBarbero' })
    barbero: User;

    @Column()
    barberoId: number;
}
