import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracion')
export class Configuracion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, default: 'StyleHub Barber Shop' })
    nombre: string;

    @Column({ length: 255, default: 'Calle 123 #45-67, Bogotá, Colombia' })
    direccion: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, default: 8.752611 })
    latitud: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, default: -75.884609 })
    longitud: number;

    @Column({ length: 20, default: '+57 300 123 4567' })
    telefono: string;

    @Column({ length: 20, default: '573001234567' }) // Formato para link de WhatsApp
    whatsapp: string;

    @Column({ length: 255, nullable: true })
    facebook: string;

    @Column({ length: 255, nullable: true })
    instagram: string;

    @Column({ length: 255, nullable: true })
    tiktok: string;

    @Column({ type: 'text', nullable: true })
    horarios: string;

    @Column({ default: true })
    suscripcionActiva: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
