// api/enviar-correo-emailjs.js
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  const { to, subject, html } = req.body;
  
  try {
    // Inicializar EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY);
    
    // Enviar correo usando EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        subject: subject,
        html_content: html,
        to_name: to.split('@')[0]
      }
    );
    
    console.log(`Correo enviado a ${to} - Motivo: cambio de contraseña`);
    res.status(200).json({ success: true, messageId: result.status });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ error: error.message });
  }
}