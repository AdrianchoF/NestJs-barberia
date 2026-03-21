import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendAppointmentConfirmation(
    to: string,
    nombreCliente: string,
    nombreBarbero: string,
    servicios: string[],
    fecha: string,
    hora: string,
  ) {
    const appName = 'StyleHub Barberia';
    const serviciosHtml = servicios.map(s => `<li>${s}</li>`).join('');

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <img src="cid:logo" alt="${appName}" style="width: 150px; margin-bottom: 20px;">
          <h1 style="color: #ee6f38; margin-bottom: 10px;">¡Cita Confirmada!</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreCliente}</strong>,</p>
          <p>Tu cita en <strong>${appName}</strong> ha sido agendada con éxito.</p>
          
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #ee6f38; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 10px 0;"><strong>Profesional:</strong> ${nombreBarbero}</p>
            <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${fecha}</p>
            <p style="margin: 0 0 10px 0;"><strong>Hora:</strong> ${hora}</p>
            <p style="margin: 10px 0 5px 0;"><strong>Servicios:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${serviciosHtml}
            </ul>
          </div>

          <p style="font-size: 14px; color: #888;">Te esperamos 10 minutos antes de tu cita. Si necesitas cancelar, por favor hazlo con al menos 2 horas de anticipación.</p>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Confirmación de Cita - ${appName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: 'c:/Users/felip/OneDrive/Documentos/ProyectoBarberia-Vue/Proyecto_Barberia/public/imagenes/logo/logo2.png',
            cid: 'logo'
          }
        ]
      });
      this.logger.log(`✅ Correo de confirmación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo a ${to}:`, error);
    }
  }
}
