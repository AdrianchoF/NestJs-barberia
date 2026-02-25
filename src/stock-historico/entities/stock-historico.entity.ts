import { Producto } from "src/producto/entities/producto.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class StockHistorico {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Producto, producto => producto.id, { eager: true })
    @JoinColumn({ name: 'producto_id' })
    producto: Producto;

    @Column('int')
    cantidad: number;

    @Column({ length: 20 })
    tipo: string; // 'entrada' | 'salida'

    @CreateDateColumn()
    fecha: Date;

    @Column({ type: 'text', nullable: true })
    nota: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    precio_unitario: number;
}
