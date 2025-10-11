import { CompraProducto } from "src/compra-producto/entities/compra-producto.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Proveedor {

    @PrimaryGeneratedColumn()
    id: number;

    @Column( { length: 100 } )
    nombre: string;

    @Column( { length: 200 } )
    direccion: string;

    @Column( { length: 15, unique: true } )
    telefono: string;

    @Column( { length: 150, unique: true } )
    email: string;

    @OneToMany(() => CompraProducto, compraProducto => compraProducto.proveedor)
    compras: CompraProducto[];
}