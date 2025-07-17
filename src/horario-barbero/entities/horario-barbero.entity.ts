import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { DiaSemana } from 'src/dia-semana/entities/dia-semana.entity';
import { FranjaHoraria } from 'src/franja-horaria/entities/franja-horaria.entity';

@Entity()
export class HorarioBarbero {
    @PrimaryGeneratedColumn({ name : 'Id_HorarioBarbero' })
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolBarbero' })
    barbero: User;

    @ManyToOne(() => DiaSemana)
    @JoinColumn({ name: 'Id_Dia' })
    dia: DiaSemana;

    @ManyToOne(() => FranjaHoraria)
    @JoinColumn({ name: 'Id_Franja' })
    franja: FranjaHoraria;
}
