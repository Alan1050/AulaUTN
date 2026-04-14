import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './CambiarPassword.css'

// ── Tipos ──────────────────────────────────────────────────────
interface PasswordResetData {
  token: string
  tipo: 'alumno' | 'docente' | 'admin'
  identificador: string
  email: string
  valido: boolean
}

// Tipo para los datos del usuario según su rol
type UsuarioData = {
  id: number
  nombre: string
  apellidoPaterno: string
  email: string
  matricula?: string
  clave?: string
  clave_empleado?: string
}

export default function CambiarPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Estados del formulario
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Estados de validación
  const [errors, setErrors] = useState({
    password: '',
    confirm: ''
  })
  
  // Estados del proceso
  const [loading, setLoading] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [resetData, setResetData] = useState<PasswordResetData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para fortaleza de contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: ''
  })

  // ── Verificar token al cargar ────────────────────────────────
  useEffect(() => {
    verificarToken()
  }, [])

  const verificarToken = async () => {
    const token = searchParams.get('token')
    const tipo = searchParams.get('tipo')
    const id = searchParams.get('id')
    
    console.log('=== VERIFICANDO TOKEN ===')
    console.log('Token:', token)
    console.log('Tipo:', tipo)
    console.log('ID (identificador):', id)
    
    // Validar que existan los parámetros
    if (!token || !tipo || !id) {
      setError('Enlace inválido o incompleto')
      setVerificando(false)
      return
    }
    
    // Validar tipo válido
    if (tipo !== 'alumno' && tipo !== 'docente' && tipo !== 'admin') {
      setError('Tipo de usuario no válido')
      setVerificando(false)
      return
    }
    
    try {
      // Determinar tabla y campo identificador según el tipo
      let tabla = ''
      let campoId = ''
      let selectFields = ''
      
      switch (tipo) {
        case 'alumno':
          tabla = 'Alumnos'
          campoId = 'matricula'
          selectFields = 'id, nombre, apellidoPaterno, email, matricula'
          break
        case 'docente':
          tabla = 'Docentes'
          campoId = 'clave'
          selectFields = 'id, nombre, apellidoPaterno, email, clave'
          break
        case 'admin':
          tabla = 'administradores'
          campoId = 'clave_empleado'
          selectFields = 'id, nombre, apellidopaterno, email, clave_empleado'
          break
      }
      
      console.log(`Buscando en tabla: ${tabla}`)
      console.log(`Campo: ${campoId}, Valor: ${id}`)
      
      // Buscar al usuario
      const { data: usuario, error: userError } = await supabase
        .from(tabla)
        .select(selectFields)
        .eq(campoId, id)
        .single<UsuarioData>()
      
      console.log('Resultado búsqueda usuario:', { usuario, userError })
      
      if (userError || !usuario) {
        console.error('❌ Usuario no encontrado:', userError)
        setError(`Usuario no encontrado con ${campoId}: ${id}`)
        setVerificando(false)
        return
      }
      
      // Obtener el email (manejar diferentes nombres de campo)
      const emailUsuario = usuario.email
      console.log('✅ Usuario encontrado:', emailUsuario)
      
      // Verificar token en la tabla de resets
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', emailUsuario)
        .eq('used', false)
        .single()
      
      console.log('Verificación token en BD:', { tokenData, tokenError })
      
      if (tokenError) {
        console.log('❌ Token no encontrado en BD o ya usado')
        setError('Token inválido o expirado')
        setVerificando(false)
        return
      }
      
      // Verificar expiración del token en BD
      const fechaExpiracion = new Date(tokenData.expires_at)
      const ahora = new Date()
      
      console.log('Fecha expiración:', fechaExpiracion)
      console.log('Fecha actual:', ahora)
      console.log('¿Expirado?', fechaExpiracion < ahora)
      
      if (fechaExpiracion < ahora) {
        setError('El enlace ha expirado. Por favor, solicita un nuevo cambio de contraseña.')
        setVerificando(false)
        return
      }
      
      // Token válido
      setResetData({
        token,
        tipo: tipo as 'alumno' | 'docente' | 'admin',
        identificador: id,
        email: emailUsuario,
        valido: true
      })
      
      setVerificando(false)
      
    } catch (error) {
      console.error('Error al verificar token:', error)
      setError('Error al verificar el enlace. Por favor, intenta nuevamente.')
      setVerificando(false)
    }
  }

  // ── Validar fortaleza de contraseña ──────────────────────────
  const validarFortalezaPassword = (password: string) => {
    let score = 0
    let message = ''
    let color = ''
    
    if (password.length === 0) {
      return { score: 0, message: '', color: '' }
    }
    
    // Criterios de fortaleza
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    // Determinar mensaje y color
    if (score <= 2) {
      message = 'Débil'
      color = '#dc2626'
    } else if (score <= 4) {
      message = 'Regular'
      color = '#f59e0b'
    } else {
      message = 'Fuerte'
      color = '#10b981'
    }
    
    return { score, message, color }
  }

  // ── Validar contraseña ───────────────────────────────────────
  const validarPassword = (password: string) => {
    const errorsList = []
    
    if (!password) {
      errorsList.push('La contraseña es requerida')
    } else {
      if (password.length < 8) {
        errorsList.push('Mínimo 8 caracteres')
      }
      if (!/[A-Z]/.test(password)) {
        errorsList.push('Al menos una mayúscula')
      }
      if (!/[0-9]/.test(password)) {
        errorsList.push('Al menos un número')
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errorsList.push('Al menos un símbolo (!@#$%^&*)')
      }
    }
    
    return errorsList
  }

  // ── Manejar cambio de contraseña ─────────────────────────────
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewPassword(value)
    
    // Validar fortaleza
    const strength = validarFortalezaPassword(value)
    setPasswordStrength(strength)
    
    // Validar requisitos
    const passwordErrors = validarPassword(value)
    setErrors(prev => ({
      ...prev,
      password: passwordErrors.join(', ')
    }))
    
    // Validar coincidencia si confirmación ya tiene valor
    if (confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirm: value === confirmPassword ? '' : 'Las contraseñas no coinciden'
      }))
    }
  }

  // ── Manejar confirmación ─────────────────────────────────────
  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    setErrors(prev => ({
      ...prev,
      confirm: newPassword === value ? '' : 'Las contraseñas no coinciden'
    }))
  }

  // ── Verificar si la nueva contraseña es igual a identificador ─
  const verificarPasswordNoIgualIdentificador = async (password: string): Promise<boolean> => {
    if (!resetData) return false
    
    let tabla = ''
    let campoId = ''
    let selectField = ''
    let nombreIdentificador = ''
    
    switch (resetData.tipo) {
      case 'alumno':
        tabla = 'Alumnos'
        campoId = 'matricula'
        selectField = 'matricula'
        nombreIdentificador = 'matrícula'
        break
      case 'docente':
        tabla = 'Docentes'
        campoId = 'clave'
        selectField = 'clave'
        nombreIdentificador = 'clave'
        break
      case 'admin':
        tabla = 'administradores'
        campoId = 'clave_empleado'
        selectField = 'clave_empleado'
        nombreIdentificador = 'clave de empleado'
        break
    }
    
    const { data: usuario } = await supabase
      .from(tabla)
      .select(selectField)
      .eq(campoId, resetData.identificador)
      .single()
    
    if (usuario) {
      const valorIdentificador = usuario[selectField as keyof typeof usuario] as string
      if (valorIdentificador === password) {
        setErrors(prev => ({
          ...prev,
          password: `La nueva contraseña no puede ser igual a tu ${nombreIdentificador}`
        }))
        return false
      }
    }
    
    return true
  }

  // ── Enviar formulario ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!newPassword || !confirmPassword) {
      setErrors({
        password: !newPassword ? 'La contraseña es requerida' : '',
        confirm: !confirmPassword ? 'Confirma tu contraseña' : ''
      })
      return
    }
    
    if (errors.password || errors.confirm) {
      return
    }
    
    // Verificar que no sea igual a identificador
    const isValid = await verificarPasswordNoIgualIdentificador(newPassword)
    if (!isValid) return
    
    setLoading(true)
    
    try {
      let tabla = ''
      let campoId = ''
      
      switch (resetData!.tipo) {
        case 'alumno':
          tabla = 'Alumnos'
          campoId = 'matricula'
          break
        case 'docente':
          tabla = 'Docentes'
          campoId = 'clave'
          break
        case 'admin':
          tabla = 'administradores'
          campoId = 'clave_empleado'
          break
      }
      
      // Para admin, también actualizar password_changed
      const updateData: any = { contrasena: newPassword }
      if (resetData!.tipo === 'admin') {
        updateData.password_changed = true
      }
      
      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from(tabla)
        .update(updateData)
        .eq(campoId, resetData!.identificador)
      
      if (updateError) throw updateError
      
      // Marcar token como usado
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .update({ used: true, used_at: new Date() })
        .eq('token', resetData!.token)
      
      if (tokenError) {
        console.warn('No se pudo marcar token como usado:', tokenError)
      }
      
      // Limpiar token de localStorage
      const emailKey = resetData!.email.replace(/[^a-zA-Z0-9]/g, '_')
      localStorage.removeItem(`reset_${emailKey}`)
      
      // Mostrar mensaje de éxito y redirigir
      alert('✅ ¡Contraseña cambiada exitosamente! Por favor, inicia sesión con tu nueva contraseña.')
      navigate('/login')
      
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      setError('Error al cambiar la contraseña. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Reenviar enlace de cambio ────────────────────────────────
  const reenviarEnlace = async () => {
    if (!resetData) return
    
    setLoading(true)
    
    try {
      const emailjs = await import('@emailjs/browser');
      
      const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      
      let tabla = ''
      let campoId = ''
      let selectFields = ''
      
      switch (resetData.tipo) {
        case 'alumno':
          tabla = 'Alumnos'
          campoId = 'matricula'
          selectFields = 'nombre, apellidoPaterno'
          break
        case 'docente':
          tabla = 'Docentes'
          campoId = 'clave'
          selectFields = 'nombre, apellidoPaterno'
          break
        case 'admin':
          tabla = 'administradores'
          campoId = 'clave_empleado'
          selectFields = 'nombre, apellidopaterno'
          break
      }
      
      const { data: usuario, error: userError } = await supabase
        .from(tabla)
        .select(selectFields)
        .eq(campoId, resetData.identificador)
        .single()
      
      if (userError || !usuario) {
        throw new Error('No se encontraron datos del usuario')
      }
      
      // Generar nuevo token
      const newToken = await generarNuevoToken(resetData.email)
      const resetUrl = `${window.location.origin}/cambiar-password?token=${newToken}&tipo=${resetData.tipo}&id=${resetData.identificador}`
      
      // Obtener nombre completo (manejar diferentes nombres de campo)
      const apellido = resetData.tipo === 'admin' 
        ? (usuario as any).apellidopaterno 
        : (usuario as any).apellidoPaterno
      
      const nombreCompleto = `${(usuario as any).nombre} ${apellido}`
      let tipoUsuario = ''
      
      switch (resetData.tipo) {
        case 'alumno': tipoUsuario = 'Alumno'; break
        case 'docente': tipoUsuario = 'Docente'; break
        case 'admin': tipoUsuario = 'Administrador'; break
      }
      
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
      
      const templateParams = {
        to_email: resetData.email,
        subject: '🔐 Nuevo enlace para cambiar tu contraseña',
        nombre: nombreCompleto,
        tipo_usuario: tipoUsuario,
        enlace: resetUrl,
        identificador: resetData.identificador,
        fecha: new Date().toLocaleString('es-MX', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
      };
      
      console.log('📧 Enviando correo de reenvío a:', resetData.email);
      
      const result = await emailjs.default.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      if (result.status === 200) {
        alert('📧 Se ha enviado un nuevo enlace a tu correo electrónico')
      } else {
        throw new Error('Error al enviar correo')
      }
      
    } catch (error) {
      console.error('Error al reenviar enlace:', error)
      alert('Error al reenviar el enlace. Por favor, contacta a soporte.')
    } finally {
      setLoading(false)
    }
  }

  // Función para generar nuevo token
  const generarNuevoToken = async (email: string): Promise<string> => {
    const payload = {
      email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }
    
    const b64 = (obj: object) => btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`
    
    const emailKey = email.replace(/[^a-zA-Z0-9]/g, '_')
    localStorage.setItem(`reset_${emailKey}`, token)
    
    await supabase
      .from('password_reset_tokens')
      .insert([{ email, token, expires_at: new Date(Date.now() + 3600000) }])
    
    return token
  }
  
  // ── Renderizado condicional ──────────────────────────────────
  if (verificando) {
    return (
      <div className="cambiar-password-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Verificando enlace de seguridad...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="cambiar-password-container">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Enlace Inválido o Expirado</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/login')} className="btn-primary">
              Volver al Login
            </button>
            {resetData && (
              <button onClick={reenviarEnlace} className="btn-secondary" disabled={loading}>
                Reenviar enlace
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="cambiar-password-container">
      <div className="cambiar-password-card">
        <div className="card-header">
          <div className="header-icon">🔐</div>
          <h1>Cambiar Contraseña</h1>
          <p>Establece una nueva contraseña segura para tu cuenta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="new-password">
              Nueva Contraseña
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Ingresa tu nueva contraseña"
                autoComplete="new-password"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span style={{ color: passwordStrength.color }}>
                  Fortaleza: {passwordStrength.message}
                </span>
              </div>
            )}
            
            <div className="password-requirements">
              <p>Requisitos:</p>
              <ul>
                <li className={newPassword.length >= 8 ? 'valid' : 'invalid'}>
                  ✓ Mínimo 8 caracteres
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'valid' : 'invalid'}>
                  ✓ Al menos una letra mayúscula
                </li>
                <li className={/[0-9]/.test(newPassword) ? 'valid' : 'invalid'}>
                  ✓ Al menos un número
                </li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'valid' : 'invalid'}>
                  ✓ Al menos un símbolo (!@#$%^&*)
                </li>
              </ul>
            </div>
            
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirmar Contraseña
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleConfirmChange}
                placeholder="Repite tu nueva contraseña"
                autoComplete="new-password"
                className={errors.confirm ? 'error' : ''}
              />
            </div>
            {errors.confirm && (
              <div className="error-message">{errors.confirm}</div>
            )}
          </div>
          
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !!errors.password || !!errors.confirm || !newPassword || !confirmPassword}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
          </div>
        </form>
        
        <div className="card-footer">
          <p>
            ¿Problemas para cambiar tu contraseña?{' '}
            <a href="/contacto">Contacta a soporte técnico</a>
          </p>
        </div>
      </div>
    </div>
  )
}