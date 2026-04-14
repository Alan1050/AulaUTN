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
    // Importar EmailJS dinámicamente
    const emailjs = await import('@emailjs/browser');
    
    // Configuración de EmailJS
    const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    
    // Inicializar EmailJS
    emailjs.default.init(EMAILJS_PUBLIC_KEY);
    
    // Generar token y URL de reset
    const resetToken = await generarTokenResetPassword(email)
    const resetUrl = `https://aulautn2.netlify.app/cambiar-password?token=${resetToken}&tipo=${tipo}&id=${identificador}`
    
    // Determinar tipo de usuario para mostrar en el correo
    let tipoUsuario = ''
    if (tipo === 'alumno') tipoUsuario = 'Alumno'
    else if (tipo === 'docente') tipoUsuario = 'Docente'
    else tipoUsuario = 'Administrador'
    
    // Determinar asunto según el motivo
    let subject = ''
    if (motivo === 'matricula') subject = '⚠️ Cambio de contraseña requerido - Seguridad'
    else if (motivo === 'clave') subject = '⚠️ Cambio de contraseña requerido - Seguridad'
    else subject = '⚠️ Cambio de contraseña requerido - Seguridad'
    
    // Datos a enviar a EmailJS (solo las variables que usa tu template)
    const templateParams = {
      to_email: email,           // Email del destinatario
      subject: subject,          // Asunto del correo
      nombre: nombre,            // Nombre completo del usuario
      tipo_usuario: tipoUsuario, // Tipo de usuario
      enlace: resetUrl,          // Enlace para cambiar contraseña
      identificador: identificador, // Matrícula o clave
      fecha: new Date().toLocaleString('es-MX', {
        dateStyle: 'full',
        timeStyle: 'short'
      })
    };
    
    console.log('📧 Enviando correo a:', email);
    console.log('📝 Datos:', templateParams);
    
    // Enviar correo usando EmailJS
    const result = await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log(`✅ Correo enviado exitosamente - Status: ${result.status}`);
    return result.status === 200;
    
  } catch (error) {
    console.error('❌ Error detallado al enviar correo con EmailJS:', error);
    return false;
  }
}

// ── Generar token para reset de password ───────────────────────
async function generarTokenResetPassword(email: string): Promise<string> {
  console.log('🔐 Generando token para email:', email);
  
  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }
  
  console.log('Payload del token:', payload);
  
  const token = await firmar({ alg: 'HS256', typ: 'JWT' }, payload)
  
  console.log('Token generado:', token);
  
  localStorage.setItem(`reset_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, token)
  
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .insert([{ email, token, expires_at: new Date(Date.now() + 3600000) }])
    .select()
  
  console.log('Guardado en Supabase:', { data, error });
  
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