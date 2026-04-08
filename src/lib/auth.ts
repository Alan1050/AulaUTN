import { supabase } from './supabaseClient'

// ── Tipos ──────────────────────────────────────────────────────
export type Rol = 'alumno' | 'docente'

export interface UsuarioSesion {
  id:       number
  nombre:   string
  rol:      Rol
  matricula?: string
  clave?:    string
  passwordChangeRequired?: boolean
}

// ── Clave secreta para firmar el JWT ───────────────────────────
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET ?? 'cambiar_esto'

// ── Codificador base64url ──────────────────────────────────────
const b64 = (obj: object) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

// ── Firma HMAC-SHA256 ──────────────────────────────────────────
async function firmar(header: object, payload: object): Promise<string> {
  const data    = `${b64(header)}.${b64(payload)}`
  const keyData = new TextEncoder().encode(JWT_SECRET)
  const msgData = new TextEncoder().encode(data)

  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, msgData)
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${data}.${sigB64}`
}

// ── Genera y guarda el JWT ─────────────────────────────────────
async function guardarSesion(usuario: UsuarioSesion) {
  const header  = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    sub:  usuario.id,
    rol:  usuario.rol,
    nombre: usuario.nombre,
    passwordChangeRequired: usuario.passwordChangeRequired || false,
    ...(usuario.matricula ? { matricula: usuario.matricula } : {}),
    ...(usuario.clave     ? { clave:     usuario.clave     } : {}),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 horas
  }
  const token = await firmar(header, payload)
  localStorage.setItem('aula_token', token)
  return token
}

// ── FUNCIÓN PRINCIPAL: Detectar si contraseña = matrícula/clave ─
function esPasswordIgualAIdentificador(
  password: string, 
  identificador: string, 
  tipo: 'alumno' | 'docente'
): boolean {
  // Limpiar y normalizar para comparación
  const passwordTrimmed = password.trim()
  const identificadorTrimmed = identificador.trim()
  
  // Comparación exacta (case-sensitive)
  return passwordTrimmed === identificadorTrimmed
}

// ── Enviar correo para cambio de contraseña ────────────────────
async function enviarCorreoCambioPassword(
  email: string,
  nombre: string,
  tipo: 'alumno' | 'docente',
  identificador: string,
  motivo: 'matricula' | 'clave'
): Promise<boolean> {
  try {
    // Generar token único para cambio de password (válido 1 hora)
    const resetToken = await generarTokenResetPassword(email)
    const resetUrl = `${window.location.origin}/cambiar-password?token=${resetToken}&tipo=${tipo}&id=${identificador}`
    
    const motivoTexto = motivo === 'matricula' 
      ? 'tu matrícula' 
      : 'tu clave de docente'
    
    // Usar fetch para llamar a tu endpoint de correo
    const response = await fetch('/api/enviar-correo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '⚠️ Cambio de contraseña requerido - Seguridad',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #dc2626;">⚠️ Cambio de Contraseña Requerido</h2>
            </div>
            
            <p>Hola <strong>${nombre}</strong>,</p>
            
            <p>Hemos detectado que estás utilizando <strong style="color: #dc2626;">${motivoTexto}</strong> como tu contraseña.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;">
                <strong>⚠️ Razón de seguridad:</strong> Por política de seguridad del sistema, 
                no está permitido usar tu ${motivoTexto} como contraseña.
              </p>
            </div>
            
            <p>Para continuar usando el sistema, debes <strong>cambiar tu contraseña inmediatamente</strong>.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${resetUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;
                        font-weight: bold;">
                🔐 Cambiar mi contraseña ahora
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #4b5563;">
                <strong>📌 Recomendaciones para tu nueva contraseña:</strong>
              </p>
              <ul style="font-size: 14px; color: #4b5563;">
                <li>Mínimo 8 caracteres</li>
                <li>Combinar letras mayúsculas y minúsculas</li>
                <li>Incluir números y símbolos</li>
                <li>No usar información personal (nombre, fecha, matrícula)</li>
              </ul>
            </div>
            
            <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
              Este enlace expirará en <strong>1 hora</strong>.<br>
              Si no solicitaste este cambio, contacta inmediatamente a soporte técnico.
            </p>
            
            <hr style="margin: 20px 0;" />
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              © 2024 AulaUTN - Sistema de Recursos Digitales
            </p>
          </div>
        `
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error al enviar correo:', error)
    return false
  }
}

// ── Generar token para reset de password ───────────────────────
async function generarTokenResetPassword(email: string): Promise<string> {
  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    iat: Math.floor(Date.now() / 1000)
  }
  const token = await firmar({ alg: 'HS256', typ: 'JWT' }, payload)
  // Guardar token temporalmente
  localStorage.setItem(`reset_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, token)
  
  // Opcional: Guardar también en Supabase para mayor seguridad
  await supabase
    .from('password_reset_tokens')
    .insert([{ email, token, expires_at: new Date(Date.now() + 3600000) }])
    .select()
  
  return token
}

// ── LOGIN PRINCIPAL MODIFICADO ─────────────────────────────────
export async function login(
  identificador: string,
  contrasena:    string
): Promise<{ rol: Rol; requiereCambioPassword?: boolean } | { error: string }> {

  const esAlumno = identificador.startsWith('TIC-')

  if (esAlumno) {
    // ── Busca en tabla Alumnos ─────────────────────────────────
    const { data, error } = await supabase
      .from('Alumnos')
      .select('id, nombre, apellidoPaterno, matricula, contrasena, email')
      .eq('matricula', identificador)
      .single()

    if (error || !data) return { error: 'Matrícula o contraseña incorrectos' }
    
    // Verificar contraseña
    const passwordMatch = data.contrasena === contrasena
    if (!passwordMatch) return { error: 'Matrícula o contraseña incorrectos' }
    
    // ⭐ CRITERIO PRINCIPAL: ¿La contraseña es IGUAL a la matrícula?
    const passwordEsIgualMatricula = esPasswordIgualAIdentificador(
      contrasena, 
      data.matricula, 
      'alumno'
    )
    
    console.log('Debug - Alumno:', {
      matricula: data.matricula,
      contrasenaIngresada: contrasena,
      sonIguales: passwordEsIgualMatricula
    })
    
    // Si la contraseña es igual a la matrícula → enviar correo
    if (passwordEsIgualMatricula) {
      if (!data.email) {
        console.error('El alumno no tiene email registrado:', data.matricula)
        return { error: 'No hay correo registrado para notificaciones de seguridad' }
      }
      
      // Enviar correo para cambio de contraseña
      const emailEnviado = await enviarCorreoCambioPassword(
        data.email,
        `${data.nombre} ${data.apellidoPaterno}`,
        'alumno',
        identificador,
        'matricula'
      )
      
      if (!emailEnviado) {
        console.error('Error al enviar correo a:', data.email)
      }
      
      // Crear sesión con flag de cambio requerido (NO permite acceso)
      await guardarSesion({
        id: data.id,
        nombre: `${data.nombre} ${data.apellidoPaterno}`,
        rol: 'alumno',
        matricula: data.matricula,
        passwordChangeRequired: true // ⚠️ Bloquea el acceso al dashboard
      })
      
      return { rol: 'alumno', requiereCambioPassword: true }
    }
    
    // ✅ Login normal (contraseña válida y diferente a la matrícula)
    await guardarSesion({
      id: data.id,
      nombre: `${data.nombre} ${data.apellidoPaterno}`,
      rol: 'alumno',
      matricula: data.matricula,
      passwordChangeRequired: false
    })
    return { rol: 'alumno' }

  } else {
    // ── Busca en tabla Docentes ────────────────────────────────
    const { data, error } = await supabase
      .from('Docentes')
      .select('id, nombre, apellidoPaterno, clave, contrasena, email')
      .eq('clave', identificador)
      .single()

    if (error || !data) return { error: 'Clave o contraseña incorrectos' }
    
    // Verificar contraseña
    const passwordMatch = data.contrasena === contrasena
    if (!passwordMatch) return { error: 'Clave o contraseña incorrectos' }
    
    // ⭐ CRITERIO PRINCIPAL: ¿La contraseña es IGUAL a la clave del docente?
    const passwordEsIgualClave = esPasswordIgualAIdentificador(
      contrasena, 
      data.clave, 
      'docente'
    )
    
    console.log('Debug - Docente:', {
      clave: data.clave,
      contrasenaIngresada: contrasena,
      sonIguales: passwordEsIgualClave
    })
    
    // Si la contraseña es igual a la clave → enviar correo
    if (passwordEsIgualClave) {
      if (!data.email) {
        console.error('El docente no tiene email registrado:', data.clave)
        return { error: 'No hay correo registrado para notificaciones de seguridad' }
      }
      
      // Enviar correo para cambio de contraseña
      const emailEnviado = await enviarCorreoCambioPassword(
        data.email,
        `${data.nombre} ${data.apellidoPaterno}`,
        'docente',
        identificador,
        'clave'
      )
      
      if (!emailEnviado) {
        console.error('Error al enviar correo a:', data.email)
      }
      
      // Crear sesión con flag de cambio requerido (NO permite acceso)
      await guardarSesion({
        id: data.id,
        nombre: `${data.nombre} ${data.apellidoPaterno}`,
        rol: 'docente',
        clave: data.clave,
        passwordChangeRequired: true // ⚠️ Bloquea el acceso al dashboard
      })
      
      return { rol: 'docente', requiereCambioPassword: true }
    }
    
    // ✅ Login normal (contraseña válida y diferente a la clave)
    await guardarSesion({
      id: data.id,
      nombre: `${data.nombre} ${data.apellidoPaterno}`,
      rol: 'docente',
      clave: data.clave,
      passwordChangeRequired: false
    })
    return { rol: 'docente' }
  }
}

// ── Cambiar contraseña (después del correo) ────────────────────
export async function cambiarPassword(
  identificador: string,
  nuevaPassword: string,
  tipo: 'alumno' | 'docente'
): Promise<{ success: boolean; error?: string }> {
  const tabla = tipo === 'alumno' ? 'Alumnos' : 'Docentes'
  const campoId = tipo === 'alumno' ? 'matricula' : 'clave'
  
  // Validar que la nueva contraseña NO sea igual a la matrícula/clave
  const { data: usuario } = await supabase
    .from(tabla)
    .select(campoId)
    .eq(campoId, identificador)
    .single()
  
  if (usuario && usuario[campoId] === nuevaPassword) {
    return { 
      success: false, 
      error: 'La nueva contraseña no puede ser igual a tu matrícula o clave' 
    }
  }
  
  // Actualizar contraseña (RECOMENDACIÓN: usar hash)
  const { error } = await supabase
    .from(tabla)
    .update({ contrasena: nuevaPassword })
    .eq(campoId, identificador)
  
  if (error) return { success: false, error: error.message }
  
  // Actualizar sesión para quitar el flag de cambio requerido
  const sesionActual = getSesion()
  if (sesionActual) {
    sesionActual.passwordChangeRequired = false
    await guardarSesion(sesionActual)
  }
  
  return { success: true }
}

// ── Leer sesión activa ─────────────────────────────────────────
export function getSesion(): UsuarioSesion | null {
  const token = localStorage.getItem('aula_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('aula_token')
      return null
    }
    return {
      id: payload.sub,
      nombre: payload.nombre,
      rol: payload.rol,
      matricula: payload.matricula,
      clave: payload.clave,
      passwordChangeRequired: payload.passwordChangeRequired || false
    }
  } catch {
    return null
  }
}

// ── Verificar si requiere cambio de password ───────────────────
export function requiereCambioPassword(): boolean {
  const sesion = getSesion()
  return sesion?.passwordChangeRequired || false
}

// ── Cerrar sesión ──────────────────────────────────────────────
export function logout() {
  localStorage.removeItem('aula_token')
}