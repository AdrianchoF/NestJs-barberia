import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cintas_promocionales')
export class CintaPromocional {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    ubicacion: string; // 'servicios' o 'productos'

    @Column({ type: 'text' })
    texto: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;
}
