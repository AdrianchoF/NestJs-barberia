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

  private formatTimeTo12h(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private generateGoogleCalendarUrl(
    title: string,
    fecha: string,
    horaInicio: string,
    servicios: string[],
    nombreBarbero: string,
  ): string {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    
    // Formatear fechas para Google (YYYYMMDDTHHmmSS)
    const cleanFecha = fecha.replace(/-/g, '');
    const cleanHoraInicio = horaInicio.replace(/:/g, '');
    
    // Por ahora asumimos 30 minutos de duración si no tenemos la hora fin exacta, 
    // pero idealmente deberíamos recibir la hora fin.
    // Para simplificar, generamos un evento de 30 min por defecto.
    const start = `${cleanFecha}T${cleanHoraInicio}`;
    
    // Calculamos una hora fin simple (30 min después)
    const [h, m, s] = horaInicio.split(':').map(Number);
    const date = new Date(2000, 0, 1, h, m, s);
    date.setMinutes(date.getMinutes() + 30);
    const cleanHoraFin = date.toTimeString().split(' ')[0].replace(/:/g, '');
    const end = `${cleanFecha}T${cleanHoraFin}`;

    const details = `Barbero: ${nombreBarbero}\nServicios: ${servicios.join(', ')}`;
    const location = 'StyleHub Barbería';

    return `${baseUrl}&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
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
    const hora12 = this.formatTimeTo12h(hora);
    const calendarUrl = this.generateGoogleCalendarUrl(
      `Cita en ${appName}`,
      fecha,
      hora,
      servicios,
      nombreBarbero
    );

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
            <p style="margin: 0 0 10px 0;"><strong>Hora:</strong> ${hora12}</p>
            <p style="margin: 10px 0 5px 0;"><strong>Servicios:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${serviciosHtml}
            </ul>
          </div>

          <div style="margin: 30px 0;">
            <a href="${calendarUrl}" target="_blank" style="background-color: #ee6f38; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              📅 Añadir a Google Calendar
            </a>
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

  async sendBarberNotification(
    to: string,
    nombreBarbero: string,
    nombreCliente: string,
    apellidoCliente: string,
    emailCliente: string,
    telefonoCliente: string,
    servicios: string[],
    fecha: string,
    hora: string,
  ) {
    const appName = 'StyleHub Barberia';
    const serviciosHtml = servicios.map(s => `<li>${s}</li>`).join('');
    const hora12 = this.formatTimeTo12h(hora);
    const calendarUrl = this.generateGoogleCalendarUrl(
      `Cita: ${nombreCliente} ${apellidoCliente}`,
      fecha,
      hora,
      servicios,
      nombreBarbero
    );

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <img src="cid:logo" alt="${appName}" style="width: 150px; margin-bottom: 20px;">
          <h1 style="color: #ee6f38; margin-bottom: 10px;">✂️ Nueva Cita Asignada</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreBarbero}</strong>,</p>
          <p>Tienes una nueva cita agendada. Aquí están los detalles:</p>

          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #ee6f38; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 10px 0;"><strong>👤 Cliente:</strong> ${nombreCliente} ${apellidoCliente}</p>
            <p style="margin: 0 0 10px 0;"><strong>📧 Email del cliente:</strong> ${emailCliente}</p>
            <p style="margin: 0 0 10px 0;"><strong>📞 Teléfono:</strong> ${telefonoCliente || 'No registrado'}</p>
            <p style="margin: 0 0 10px 0;"><strong>📅 Fecha:</strong> ${fecha}</p>
            <p style="margin: 0 0 10px 0;"><strong>🕐 Hora:</strong> ${hora12}</p>
            <p style="margin: 10px 0 5px 0;"><strong>💈 Servicios:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${serviciosHtml}
            </ul>
          </div>

          <div style="margin: 30px 0;">
            <a href="${calendarUrl}" target="_blank" style="background-color: #ee6f38; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              📅 Añadir a Google Calendar
            </a>
          </div>

          <p style="font-size: 14px; color: #888;">Por favor asegúrate de estar disponible a tiempo. Si tienes algún inconveniente, comunícate con la administración.</p>

          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Nueva cita asignada - ${appName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: 'c:/Users/felip/OneDrive/Documentos/ProyectoBarberia-Vue/Proyecto_Barberia/public/imagenes/logo/logo2.png',
            cid: 'logo'
          }
        ]
      });
      this.logger.log(`✅ Correo al barbero enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo al barbero ${to}:`, error);
    }
  }

  async sendAdminNotification(
    to: string,
    nombreCliente: string,
    apellidoCliente: string,
    emailCliente: string,
    telefonoCliente: string,
    nombreBarbero: string,
    emailBarbero: string,
    servicios: string[],
    fecha: string,
    hora: string,
  ) {
    const appName = 'StyleHub Barberia';
    const serviciosHtml = servicios.map(s => `<li>${s}</li>`).join('');
    const hora12 = this.formatTimeTo12h(hora);

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <img src="cid:logo" alt="${appName}" style="width: 150px; margin-bottom: 20px;">
          <h1 style="color: #ee6f38; margin-bottom: 10px;">📋 Nueva Reserva Registrada</h1>
          <p style="font-size: 18px;">Se ha agendado una nueva cita en el sistema.</p>

          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #ee6f38; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #ee6f38;"><strong>👤 Datos del Cliente</strong></p>
            <p style="margin: 0 0 8px 0;"><strong>Nombre:</strong> ${nombreCliente} ${apellidoCliente}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${emailCliente}</p>
            <p style="margin: 0 0 20px 0;"><strong>Teléfono:</strong> ${telefonoCliente || 'No registrado'}</p>

            <p style="margin: 0 0 15px 0; font-size: 16px; color: #ee6f38;"><strong>✂️ Datos de la Cita</strong></p>
            <p style="margin: 0 0 8px 0;"><strong>Barbero asignado:</strong> ${nombreBarbero} (${emailBarbero})</p>
            <p style="margin: 0 0 8px 0;"><strong>Fecha:</strong> ${fecha}</p>
            <p style="margin: 0 0 8px 0;"><strong>Hora:</strong> ${hora12}</p>
            <p style="margin: 10px 0 5px 0;"><strong>💈 Servicios:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${serviciosHtml}
            </ul>
          </div>

          <p style="font-size: 14px; color: #888;">Esta notificación fue generada automáticamente al registrarse una nueva reserva en el sistema.</p>

          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Panel de Administración.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Nueva reserva registrada - ${appName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: 'c:/Users/felip/OneDrive/Documentos/ProyectoBarberia-Vue/Proyecto_Barberia/public/imagenes/logo/logo2.png',
            cid: 'logo'
          }
        ]
      });
      this.logger.log(`✅ Correo al administrador enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo al administrador ${to}:`, error);
    }
  }

  async sendPenaltyNotification(
    to: string,
    nombreCliente: string,
    motivo: string,
    hasta: Date | null,
  ) {
    const appName = 'StyleHub Barberia';
    const dateStr = hasta ? new Date(hasta).toLocaleString() : 'Indefinido';

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <img src="cid:logo" alt="${appName}" style="width: 150px; margin-bottom: 20px;">
          <h1 style="color: #ee6f38; margin-bottom: 10px;">Notificación de Sanción</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreCliente}</strong>,</p>
          <p>Te informamos que tu cuenta en <strong>${appName}</strong> ha sido suspendida temporalmente.</p>
          
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #ee6f38; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 10px 0;"><strong>Motivo:</strong> ${motivo}</p>
            <p style="margin: 0 0 10px 0;"><strong>Fecha de reactivación:</strong> ${dateStr}</p>
          </div>

          <p style="font-size: 14px; color: #888;">Si crees que esto es un error o deseas apelar la decisión, por favor contacta con nosotros directamente en el local.</p>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Gestión de Calidad.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Notificación de Suspensión de Cuenta - ${appName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: 'c:/Users/felip/OneDrive/Documentos/ProyectoBarberia-Vue/Proyecto_Barberia/public/imagenes/logo/logo2.png',
            cid: 'logo'
          }
        ]
      });
      this.logger.log(`✅ Correo de sanción enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo de sanción a ${to}:`, error);
    }
  }

  async sendCancellationNotificationToBarber(
    to: string,
    nombreBarbero: string,
    nombreCliente: string,
    servicio: string,
    fecha: string,
    hora: string,
    motivo: string
  ) {
    const appName = 'StyleHub Barberia';
    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="color: #e53935; margin-bottom: 10px;">🚫 Cita Cancelada</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreBarbero}</strong>,</p>
          <p>Te informamos que una de tus citas agendadas ha sido cancelada.</p>
          
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #e53935; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 10px 0;"><strong>Cliente afectado:</strong> ${nombreCliente}</p>
            <p style="margin: 0 0 10px 0;"><strong>Servicio:</strong> ${servicio}</p>
            <p style="margin: 0 0 10px 0;"><strong>Día y Hora:</strong> ${fecha} a las ${this.formatTimeTo12h(hora)}</p>
            <div style="background-color: #2a2a2a; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
              <p style="margin: 0; color: #ffeb3b;"><strong>Motivo de la cancelación proporcionado:</strong></p>
              <p style="margin: 10px 0 0 0; font-style: italic;">"${motivo}"</p>
            </div>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Aviso Importante: Cita Cancelada - ${appName}`,
        html: htmlContent,
      });
      this.logger.log(`✅ Correo de cancelación enviado al barbero: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo de cancelación al barbero ${to}:`, error);
    }
  }

  async sendCancellationNotificationToClient(
    to: string,
    nombreCliente: string,
    nombreBarbero: string,
    servicio: string,
    fecha: string,
    hora: string,
    motivo: string
  ) {
    const appName = 'StyleHub Barberia';
    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="color: #e53935; margin-bottom: 10px;">🚫 Cita Cancelada</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreCliente}</strong>,</p>
          <p>Lamentamos informarte que tu cita ha sido cancelada desde la administración o peluquería debido a una fuerza mayor.</p>
          
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #e53935; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 10px 0;"><strong>Profesional asignado:</strong> ${nombreBarbero}</p>
            <p style="margin: 0 0 10px 0;"><strong>Servicio:</strong> ${servicio}</p>
            <p style="margin: 0 0 10px 0;"><strong>Día y Hora:</strong> ${fecha} a las ${this.formatTimeTo12h(hora)}</p>
            <div style="background-color: #2a2a2a; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
              <p style="margin: 0; color: #ffeb3b;"><strong>Motivo de nuestra cancelación:</strong></p>
              <p style="margin: 10px 0 0 0; font-style: italic;">"${motivo}"</p>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #888;">Te pedimos sinceras disculpas por los inconvenientes. Por favor contáctanos para que te ayudemos a re-agendar de forma prioritaria.</p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `Cita Cancelada - ${appName}`,
        html: htmlContent,
      });
      this.logger.log(`✅ Correo de cancelación enviado al cliente: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo de cancelación al cliente ${to}:`, error);
    }
  }

  async sendPostServiceRating(
    to: string,
    nombreCliente: string,
    nombreBarbero: string,
    servicios: string[],
    fecha: string,
  ) {
    const appName = 'StyleHub Barberia';
    const serviciosHtml = servicios.map(s => `<li>${s}</li>`).join('');

    // Generate static stars HTML
    const starsHtml = Array(5).fill(0).map((_, i) => `
      <span style="color: #ee6f38; font-size: 32px; margin: 0 5px; cursor: pointer; text-decoration: none;">★</span>
    `).join('');

    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: #1a1a1a; padding: 40px; border-radius: 10px; color: white; text-align: center;">
          <img src="cid:logo" alt="${appName}" style="width: 150px; margin-bottom: 20px;">
          <h1 style="color: #ee6f38; margin-bottom: 10px;">¡Gracias por tu visita!</h1>
          <p style="font-size: 18px;">Hola <strong>${nombreCliente}</strong>,</p>
          <p>Esperamos que hayas disfrutado de tu servicio hoy.</p>
          
          <div style="background-color: rgba(255,255,255,0.05); border: 1px solid #ee6f38; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
            <h3 style="color: #ee6f38; margin-top: 0; text-align: center;">Resumen de tu visita</h3>
            <p style="margin: 0 0 10px 0;"><strong>Profesional:</strong> ${nombreBarbero}</p>
            <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${fecha}</p>
            <p style="margin: 10px 0 5px 0;"><strong>Servicios realizados:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              ${serviciosHtml}
            </ul>
          </div>

          <div style="margin: 30px 0; background-color: #2a2a2a; padding: 25px; border-radius: 8px;">
            <p style="font-size: 18px; margin-top: 0; font-weight: bold;">¿Qué tal te pareció la atención de ${nombreBarbero}?</p>
            <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0;">
              ${starsHtml}
            </div>
            <p style="font-size: 14px; color: #888; margin-bottom: 0;">Presiona las estrellas para calificar nuestro servicio. Tu opinión es muy importante para seguir mejorando.</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">&copy; ${new Date().getFullYear()} ${appName} - Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: `¿Cómo te fue en tu cita? Califica tu experiencia en ${appName}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: 'c:/Users/felip/OneDrive/Documentos/ProyectoBarberia-Vue/Proyecto_Barberia/public/imagenes/logo/logo2.png',
            cid: 'logo'
          }
        ]
      });
      this.logger.log(`✅ Correo de calificación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo de calificación a ${to}:`, error);
    }
  }
}
