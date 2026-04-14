import { supabase } from './supabaseClient'

// ── Tipos ──────────────────────────────────────────────────────
export type Rol = 'alumno' | 'docente' | 'admin'

export interface UsuarioSesion {
  id:       number
  nombre:   string
  rol:      Rol
  matricula?: string
  email?:   string
  clave?:    string
  clave_empleado?: string
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
    email: usuario.email,
    passwordChangeRequired: usuario.passwordChangeRequired || false,
    ...(usuario.matricula ? { matricula: usuario.matricula } : {}),
    ...(usuario.clave     ? { clave:     usuario.clave     } : {}),
    ...(usuario.clave_empleado ? { clave_empleado: usuario.clave_empleado } : {}),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  }
  const token = await firmar(header, payload)
  localStorage.setItem('aula_token', token)
  return token
}

// ── FUNCIÓN: Detectar si contraseña = identificador ────────────
function esPasswordIgualAIdentificador(
  password: string, 
  identificador: string
): boolean {
  const passwordTrimmed = password.trim()
  const identificadorTrimmed = identificador.trim()
  return passwordTrimmed === identificadorTrimmed
}

// ── Enviar correo para cambio de contraseña ────────────────────
async function enviarCorreoCambioPassword(
  email: string,
  nombre: string,
  tipo: 'alumno' | 'docente' | 'admin',
  identificador: string,
  motivo: 'matricula' | 'clave' | 'clave_empleado'
): Promise<boolean> {
  try {
    const resetToken = await generarTokenResetPassword(email)
    const resetUrl = `${window.location.origin}/cambiar-password?token=${resetToken}&tipo=${tipo}&id=${identificador}`
    
    let motivoTexto = ''
    if (motivo === 'matricula') motivoTexto = 'tu matrícula'
    else if (motivo === 'clave') motivoTexto = 'tu clave de docente'
    else motivoTexto = 'tu clave de empleado'
    
    let tipoUsuario = ''
    if (tipo === 'alumno') tipoUsuario = 'Alumno'
    else if (tipo === 'docente') tipoUsuario = 'Docente'
    else tipoUsuario = 'Administrador'
    
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
                <li>No usar información personal (nombre, fecha, matrícula, clave)</li>
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
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }
  const token = await firmar({ alg: 'HS256', typ: 'JWT' }, payload)
  localStorage.setItem(`reset_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, token)
  
  await supabase
    .from('password_reset_tokens')
    .insert([{ email, token, expires_at: new Date(Date.now() + 3600000) }])
    .select()
  
  return token
}

// ── LOGIN PRINCIPAL ────────────────────────────────────────────
export async function login(
  identificador: string,
  contrasena: string
): Promise<{ rol: Rol; requiereCambioPassword?: boolean } | { error: string }> {

  console.log('🔐 ===== INICIO DE LOGIN =====')
  console.log('Identificador:', identificador)

  // 1. VERIFICAR ADMINISTRADOR PRIMERO
  console.log('👑 Buscando en tabla administradores...')
  
  const { data: admin, error: adminError } = await supabase
    .from('administradores')
    .select('id, nombre, apellidopaterno, email, contrasena, clave_empleado, password_changed')
    .or(`email.eq.${identificador},clave_empleado.eq.${identificador}`)
    .single()

  if (admin && !adminError) {
    console.log('👑 Modo: ADMINISTRADOR encontrado:', admin.nombre)
    
    if (admin.contrasena !== contrasena) {
      console.log('❌ Contraseña incorrecta para administrador')
      return { error: 'Credenciales incorrectas' }
    }
    
    // Verificar si requiere cambio de contraseña
    const passwordEsIgualClaveEmpleado = esPasswordIgualAIdentificador(
      contrasena,
      admin.clave_empleado
    )
    
    const requiereCambio = passwordEsIgualClaveEmpleado || !admin.password_changed
    
    if (requiereCambio) {
      console.log('⚠️ Administrador requiere cambio de contraseña')
      
      if (!admin.email) {
        return { error: 'No hay correo registrado para notificaciones de seguridad' }
      }
      
      await enviarCorreoCambioPassword(
        admin.email,
        `${admin.nombre} ${admin.apellidopaterno}`,
        'admin',
        identificador,
        'clave_empleado'
      )
      
      await guardarSesion({
        id: admin.id,
        nombre: `${admin.nombre} ${admin.apellidopaterno}`,
        rol: 'admin',
        email: admin.email,
        clave_empleado: admin.clave_empleado,
        passwordChangeRequired: true
      })
      
      return { rol: 'admin', requiereCambioPassword: true }
    }
    
    console.log('✅ Login exitoso - Administrador')
    await guardarSesion({
      id: admin.id,
      nombre: `${admin.nombre} ${admin.apellidopaterno}`,
      rol: 'admin',
      email: admin.email,
      clave_empleado: admin.clave_empleado,
      passwordChangeRequired: false
    })
    return { rol: 'admin' }
  }

  // 2. VERIFICAR ALUMNO
  const esAlumno = identificador.startsWith('TIC-')
  
  if (esAlumno) {
    console.log('👨‍🎓 Modo: ALUMNO')
    
    const { data, error } = await supabase
      .from('Alumnos')
      .select('id, nombre, apellidoPaterno, matricula, contrasena, email')
      .eq('matricula', identificador)
      .single()

    if (error || !data) {
      console.error('❌ Alumno no encontrado:', error)
      return { error: 'Matrícula o contraseña incorrectos' }
    }
    
    if (data.contrasena !== contrasena) {
      console.log('❌ Contraseña incorrecta')
      return { error: 'Matrícula o contraseña incorrectos' }
    }
    
    // Verificar si la contraseña es igual a la matrícula
    const requiereCambio = esPasswordIgualAIdentificador(contrasena, data.matricula)
    
    if (requiereCambio) {
      console.log('⚠️ Alumno requiere cambio de contraseña (contraseña = matrícula)')
      
      if (!data.email) {
        return { error: 'No hay correo registrado para notificaciones de seguridad' }
      }
      
      await enviarCorreoCambioPassword(
        data.email,
        `${data.nombre} ${data.apellidoPaterno}`,
        'alumno',
        identificador,
        'matricula'
      )
      
      await guardarSesion({
        id: data.id,
        nombre: `${data.nombre} ${data.apellidoPaterno}`,
        rol: 'alumno',
        email: data.email,
        matricula: data.matricula,
        passwordChangeRequired: true
      })
      
      return { rol: 'alumno', requiereCambioPassword: true }
    }
    
    console.log('✅ Login exitoso - Alumno')
    await guardarSesion({
      id: data.id,
      nombre: `${data.nombre} ${data.apellidoPaterno}`,
      rol: 'alumno',
      email: data.email,
      matricula: data.matricula,
      passwordChangeRequired: false
    })
    return { rol: 'alumno' }
  }

  // 3. VERIFICAR DOCENTE
  console.log('👨‍🏫 Modo: DOCENTE')
  
  const { data, error } = await supabase
    .from('Docentes')
    .select('id, nombre, apellidoPaterno, clave, contrasena, email')
    .eq('clave', identificador)
    .single()

  if (error || !data) {
    console.error('❌ Docente no encontrado:', error)
    return { error: 'Clave o contraseña incorrectos' }
  }
  
  if (data.contrasena !== contrasena) {
    console.log('❌ Contraseña incorrecta')
    return { error: 'Clave o contraseña incorrectos' }
  }
  
  // Verificar si la contraseña es igual a la clave
  const requiereCambio = esPasswordIgualAIdentificador(contrasena, data.clave)
  
  if (requiereCambio) {
    console.log('⚠️ Docente requiere cambio de contraseña (contraseña = clave)')
    
    if (!data.email) {
      return { error: 'No hay correo registrado para notificaciones de seguridad' }
    }
    
    await enviarCorreoCambioPassword(
      data.email,
      `${data.nombre} ${data.apellidoPaterno}`,
      'docente',
      identificador,
      'clave'
    )
    
    await guardarSesion({
      id: data.id,
      nombre: `${data.nombre} ${data.apellidoPaterno}`,
      rol: 'docente',
      email: data.email,
      clave: data.clave,
      passwordChangeRequired: true
    })
    
    return { rol: 'docente', requiereCambioPassword: true }
  }
  
  console.log('✅ Login exitoso - Docente')
  await guardarSesion({
    id: data.id,
    nombre: `${data.nombre} ${data.apellidoPaterno}`,
    rol: 'docente',
    email: data.email,
    clave: data.clave,
    passwordChangeRequired: false
  })
  return { rol: 'docente' }
}

// ── Cambiar contraseña ─────────────────────────────────────────
export async function cambiarPassword(
  identificador: string,
  nuevaPassword: string,
  tipo: 'alumno' | 'docente' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  
  let tabla = ''
  let campoId = ''
  let campoIdentificador = ''
  
  switch (tipo) {
    case 'admin':
      tabla = 'administradores'
      campoId = 'clave_empleado'
      campoIdentificador = 'clave_empleado'
      break
    case 'alumno':
      tabla = 'Alumnos'
      campoId = 'matricula'
      campoIdentificador = 'matricula'
      break
    case 'docente':
      tabla = 'Docentes'
      campoId = 'clave'
      campoIdentificador = 'clave'
      break
  }
  
  // Validar que la nueva contraseña NO sea igual al identificador
  const { data: usuario } = await supabase
    .from(tabla)
    .select(campoId)
    .eq(campoIdentificador, identificador)
    .single()
  
  if (usuario) {
    const valorIdentificador = usuario[campoId as keyof typeof usuario] as string
    if (valorIdentificador === nuevaPassword) {
      return { 
        success: false, 
        error: `La nueva contraseña no puede ser igual a tu ${tipo === 'admin' ? 'clave de empleado' : tipo === 'alumno' ? 'matrícula' : 'clave'}` 
      }
    }
  }
  
  // Validar longitud mínima
  if (nuevaPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }
  
  // Actualizar contraseña
  // Para admin, también actualizar password_changed
  const updateData: any = { contrasena: nuevaPassword }
  if (tipo === 'admin') {
    updateData.password_changed = true
  }
  
  const { error } = await supabase
    .from(tabla)
    .update(updateData)
    .eq(campoIdentificador, identificador)
  
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
      email: payload.email,
      clave: payload.clave,
      clave_empleado: payload.clave_empleado,
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