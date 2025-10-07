import { CategoriaProducto } from "src/categoria-producto/entities/categoria-producto.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @ManyToOne(() => CategoriaProducto, (categoria: CategoriaProducto) => categoria.productos, { eager: true })
    categoria: CategoriaProducto;

    @Column({ length: 255 })
    imagenUrl: string;
}