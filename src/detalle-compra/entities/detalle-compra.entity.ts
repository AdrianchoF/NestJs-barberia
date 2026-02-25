import { CompraProducto } from "src/compra-producto/entities/compra-producto.entity";
import { Producto } from "src/producto/entities/producto.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class DetalleCompra {
    @PrimaryGeneratedColumn()
    id_detalle: number;

    @ManyToOne(() => CompraProducto, compra => compra.detalles, { eager: true })
    @JoinColumn({ name: "id_compra" })
    compra: CompraProducto;

    @ManyToOne(() => Producto, producto => producto.detallesCompra, { eager: true })
    @JoinColumn({ name: "id_producto" })
    producto: Producto;

    @Column('int')
    cantidad: number;

    @Column('int', { nullable: true })
    cantidad_recibida: number;

    @Column({ length: 50, nullable: true })
    codigo_producto?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precio_unitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    // Campos opcionales para pedidos manuales (cuando el producto no existe aún)
    @Column({ length: 200, nullable: true })
    nombre_producto?: string;

    @Column('text', { nullable: true })
    descripcion_producto?: string;

    @Column({ length: 255, nullable: true })
    imagenUrl_producto?: string;

    @Column('int', { nullable: true })
    categoriaId_producto?: number;
}