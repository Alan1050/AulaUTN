import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './CambiarPassword.css'

// ── Tipos ──────────────────────────────────────────────────────
interface PasswordResetData {
  token: string
  tipo: 'alumno' | 'docente'
  identificador: string
  email: string
  valido: boolean
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
    
    console.log('Verificando token:', { token, tipo, id })
    
    // Validar que existan los parámetros
    if (!token || !tipo || !id) {
      setError('Enlace inválido o incompleto')
      setVerificando(false)
      return
    }
    
    // Validar tipo válido
    if (tipo !== 'alumno' && tipo !== 'docente') {
      setError('Tipo de usuario no válido')
      setVerificando(false)
      return
    }
    
    try {
      // Verificar token en Supabase
      const tabla = tipo === 'alumno' ? 'Alumnos' : 'Docentes'
      const campoId = tipo === 'alumno' ? 'matricula' : 'clave'
      
      // Buscar al usuario
      const { data: usuario, error: userError } = await supabase
        .from(tabla)
        .select('id, nombre, apellidoPaterno, email, matricula, clave')
        .eq(campoId, id)
        .single()
      
      if (userError || !usuario) {
        console.error('Usuario no encontrado:', userError)
        setError('Usuario no encontrado')
        setVerificando(false)
        return
      }
      
      // Verificar token en la tabla de resets (opcional pero recomendado)
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', usuario.email)
        .eq('used', false)
        .single()
      
      // Si no hay tabla de tokens, solo verificamos que el token exista en localStorage
      if (tokenError) {
        // Fallback: verificar en localStorage
        const storedToken = localStorage.getItem(`reset_${usuario.email.replace(/[^a-zA-Z0-9]/g, '_')}`)
        
        if (storedToken !== token) {
          setError('Token inválido o expirado')
          setVerificando(false)
          return
        }
        
        // Verificar expiración (1 hora)
        const tokenPayload = JSON.parse(atob(token.split('.')[1]))
        if (tokenPayload.exp < Math.floor(Date.now() / 1000)) {
          setError('El enlace ha expirado. Por favor, solicita un nuevo cambio de contraseña.')
          setVerificando(false)
          return
        }
      } else {
        // Verificar expiración del token en BD
        if (new Date(tokenData.expires_at) < new Date()) {
          setError('El enlace ha expirado. Por favor, solicita un nuevo cambio de contraseña.')
          setVerificando(false)
          return
        }
      }
      
      // Token válido
      setResetData({
        token,
        tipo: tipo as 'alumno' | 'docente',
        identificador: id,
        email: usuario.email,
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

  // ── Verificar si la nueva contraseña es igual a matrícula/clave ─
  const verificarPasswordNoIgualIdentificador = async (password: string): Promise<boolean> => {
    if (!resetData) return false
    
    const tabla = resetData.tipo === 'alumno' ? 'Alumnos' : 'Docentes'
    const campoId = resetData.tipo === 'alumno' ? 'matricula' : 'clave'
    
    const { data: usuario } = await supabase
      .from(tabla)
      .select(campoId)
      .eq(campoId, resetData.identificador)
      .single()
    
    if (usuario && usuario[campoId] === password) {
      setErrors(prev => ({
        ...prev,
        password: `La nueva contraseña no puede ser igual a tu ${resetData.tipo === 'alumno' ? 'matrícula' : 'clave'}`
      }))
      return false
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
    
    // Verificar que no sea igual a matrícula/clave
    const isValid = await verificarPasswordNoIgualIdentificador(newPassword)
    if (!isValid) return
    
    setLoading(true)
    
    try {
      const tabla = resetData!.tipo === 'alumno' ? 'Alumnos' : 'Docentes'
      const campoId = resetData!.tipo === 'alumno' ? 'matricula' : 'clave'
      
      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from(tabla)
        .update({ contrasena: newPassword })
        .eq(campoId, resetData!.identificador)
      
      if (updateError) throw updateError
      
      // Marcar token como usado (si existe la tabla)
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
      // Generar nuevo token
      const newToken = await generarNuevoToken(resetData.email)
      const resetUrl = `${window.location.origin}/cambiar-password?token=${newToken}&tipo=${resetData.tipo}&id=${resetData.identificador}`
      
      // Enviar nuevo correo
      const response = await fetch('/api/enviar-correo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: resetData.email,
          subject: 'Nuevo enlace para cambiar tu contraseña',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Nuevo enlace para cambiar tu contraseña</h2>
              <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
              <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Cambiar mi contraseña
              </a>
              <p>Este enlace expirará en 1 hora.</p>
            </div>
          `
        })
      })
      
      if (response.ok) {
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

  // Función auxiliar para generar token
  const generarNuevoToken = async (email: string): Promise<string> => {
    // Implementación simplificada - en producción usa la misma lógica que en auth.ts
    const payload = {
      email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }
    const token = btoa(JSON.stringify(payload))
    return token
  }

  // ── Renderizado condicional ──────────────────────────────────
  
  // Estado: Verificando token
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
  
  // Estado: Error
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
  
  // Estado: Formulario de cambio
  return (
    <div className="cambiar-password-container">
      <div className="cambiar-password-card">
        <div className="card-header">
          <div className="header-icon">🔐</div>
          <h1>Cambiar Contraseña</h1>
          <p>Establece una nueva contraseña segura para tu cuenta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="password-form">
          {/* Nueva contraseña */}
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
            
            {/* Indicador de fortaleza */}
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
            
            {/* Requisitos de contraseña */}
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
          
          {/* Confirmar contraseña */}
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
          
          {/* Información de seguridad */}
          <div className="security-info">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Recomendaciones de seguridad:</strong>
              <ul>
                <li>No uses la misma contraseña que en otros servicios</li>
                <li>Evita información personal (nombre, fecha de nacimiento)</li>
                <li>No compartas tu contraseña con nadie</li>
              </ul>
            </div>
          </div>
          
          {/* Botones de acción */}
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