import { IsDate, IsEnum } from "class-validator";
import { User } from "src/auth/entities/user.entity";
import { Servicio } from "src/servicio/entities/servicio.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum EstadoCita {
    AGENDADA = 'agendada',
    CANCELADA = 'cancelada',
    COMPLETADA = 'completada',
}

@Entity('cita')
export class Cita {
    @PrimaryGeneratedColumn()
    id_cita: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolCliente' })
    cliente: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'Id_RolBarbero' })
    barbero: User;

    @ManyToOne(() => Servicio)
    @JoinColumn({ name: 'Id_Servicio' })
    servicio: Servicio;

    @Column({ type: 'time' })
    hora: string

    @IsDate()
    @Column({ type: 'date' })
    fecha: Date

    @Column({
        type: 'enum',
        enum: EstadoCita,
        default: EstadoCita.AGENDADA
    })
    estado: EstadoCita;
}