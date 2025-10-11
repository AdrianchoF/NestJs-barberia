import { CategoriaProducto } from "src/categoria-producto/entities/categoria-producto.entity";
import { DetalleCompra } from "src/detalle-compra/entities/detalle-compra.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Producto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nombre: string;

    @Column('text')
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column('int')
    stock: number;

    @Column({ length: 255 })
    imagenUrl: string;

    @ManyToOne(() => CategoriaProducto, (categoria: CategoriaProducto) => categoria.productos, { eager: true })
    @JoinColumn({ name: 'categoriaId' })
    categoria: CategoriaProducto;

    @OneToMany(() => DetalleCompra, detalle => detalle.producto)
    detallesCompra: DetalleCompra[];

    @Column()
    categoriaId: number;
}