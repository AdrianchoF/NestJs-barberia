import { User } from "src/auth/entities/user.entity";
import { Servicio } from "src/servicio/entities/servicio.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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
}