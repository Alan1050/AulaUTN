// utils/emailService.ts
import emailjs from '@emailjs/browser';

// Configuración
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Inicializar EmailJS una sola vez
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailData {
  to_email: string;
  nombre: string;
  tipo_usuario: 'alumno' | 'docente';
  enlace: string;
  identificador: string;
  fecha: string;
}

export const enviarCorreoRecuperacion = async (data: EmailData) => {
  try {
    const templateParams = {
      to_email: data.to_email,
      nombre: data.nombre,
      tipo_usuario: data.tipo_usuario === 'alumno' ? 'Alumno' : 'Docente',
      enlace: data.enlace,
      identificador: data.identificador,
      fecha: data.fecha
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return { success: true, status: result.status };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, error };
  }
};