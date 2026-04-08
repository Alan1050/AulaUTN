// Usando Resend (recomendado) o Nodemailer
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  
  const { to, subject, html } = req.body
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'TIC-310011@utnay.edu.mx',
      to: [to],
      subject: subject,
      html: html
    })
    
    if (error) throw error
    
    console.log(`Correo enviado a ${to} - Motivo: contraseña = identificador`)
    res.status(200).json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Error al enviar correo:', error)
    res.status(500).json({ error: error.message })
  }
}