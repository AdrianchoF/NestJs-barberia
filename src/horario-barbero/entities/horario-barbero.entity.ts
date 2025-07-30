import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { FranjaHoraria } from 'src/franja-horaria/entities/franja-horaria.entity';

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
    @PrimaryGeneratedColumn({ name : 'Id_HorarioBarbero' })
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolBarbero' })
    barbero: User;

    @Column({
        type: 'enum',
        enum: DiaSemana,
        default: DiaSemana.LUNES
    })
    Dia_semana:DiaSemana;

    @ManyToOne(() => FranjaHoraria)
    @JoinColumn({ name: 'Id_Franja' })
    franja: FranjaHoraria;
}
