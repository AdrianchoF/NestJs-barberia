import { CategoriaProducto } from "src/categoria-producto/entities/categoria-producto.entity";
import { DetalleCompra } from "src/detalle-compra/entities/detalle-compra.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Producto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true, nullable: true })
    codigo?: string;

    @Column({ length: 100 })
    nombre: string;

    @Column('text')
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column('int')
    stock: number;

    @Column('int', { default: 0 })
    stock_minimo: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    precio_costo: number;

    @Column('boolean', { default: false })
    publicado: boolean;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    precio_venta?: number;

    @Column('varchar', { length: 255, nullable: true })
    imagenUrl?: string | null;

    @ManyToOne(() => CategoriaProducto, (categoria: CategoriaProducto) => categoria.productos, { eager: true })
    @JoinColumn({ name: 'categoriaId' })
    categoria: CategoriaProducto;

    @OneToMany(() => DetalleCompra, detalle => detalle.producto)
    detallesCompra: DetalleCompra[];

    @Column('int', { nullable: true })
    categoriaId?: number | null;
}