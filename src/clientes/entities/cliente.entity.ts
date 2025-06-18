import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Cliente {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column({ length: 100 })
    apellido: string;

    @Column({ unique: true, length: 150 })
    email: string;

    @Column({ length: 255, select: false })
    password: string;

    @Column({ length: 20, nullable: true })
    telefono: string;

    @Column({ type: 'date', nullable: true })
    fechaNacimiento: Date;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    fechaCreacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;
}