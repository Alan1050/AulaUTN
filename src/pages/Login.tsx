import './Login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()

  // ── Estado de los campos ──────────────────────────────────────
  const [matricula, setMatricula] = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // ── Estado de errores (uno por campo) ────────────────────────
  const [errors, setErrors] = useState({
    matricula: '',
    password:  '',
    general: ''
  })

  // ── Validación de matrícula ───────────────────────────────────
  const validarMatricula = (valor: string) => {
    let msg = ''

    if (valor.length === 0) {
      msg = 'El identificador es requerido'
    } else if (/^TIC-/.test(valor)) {
      // 👨‍🎓 Es alumno — valida formato TIC-XXXXXX
      if (!/^TIC-\d{6}$/.test(valor)) {
        msg = 'Formato de alumno inválido. Ej: TIC-310000'
      }
    } else if (/^ADMN/i.test(valor)) {
      // 👑 Es administrador — valida formato ADMNXXXXXX (ADMN + 6 números)
      if (!/^ADMN\d{6}$/i.test(valor)) {
        msg = 'Formato de administrador inválido. Ej: ADMN000000'
      }
    } else if (/^\d/.test(valor)) {
      // 👨‍🏫 Es maestro — valida que sean solo números
      if (!/^\d+$/.test(valor)) {
        msg = 'La clave de docente solo debe contener números'
      }
    } else {
      msg = 'Formato no válido. Use: TIC-310000 (alumno), ADMN000000 (admin) o solo números (docente)'
    }

    setErrors(prev => ({ ...prev, matricula: msg }))
  }

  // ── Validación de contraseña ──────────────────────────────────
  const validarPassword = (valor: string) => {
    let msg = ''

    if (valor.length === 0) {
      msg = 'La contraseña es requerida'
    }

    setErrors(prev => ({ ...prev, password: msg }))
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar error general
    setErrors(prev => ({ ...prev, general: '' }))

    // Validaciones
    validarMatricula(matricula)
    validarPassword(password)
    
    if (errors.matricula || errors.password || !matricula || !password) {
      console.log('❌ Validación fallida:', { matricula, password, errors })
      return
    }

    setLoading(true)
    
    console.log('🚀 Intentando login con:', { 
      identificador: matricula, 
      contrasena: password 
    })

    try {
      const result = await login(matricula, password)
      
      console.log('📦 Resultado del login:', result)
      
      if ('error' in result) {
        // Error de autenticación
        console.error('❌ Error de login:', result.error)
        setErrors(prev => ({ 
          ...prev, 
          general: result.error,
          password: result.error 
        }))
        setLoading(false)
        return
      }
      
      // Login exitoso
      console.log('✅ Login exitoso! Rol:', result.rol)
      
      // Verificar si requiere cambio de contraseña
      if (result.requiereCambioPassword) {
        console.log('⚠️ Usuario requiere cambio de contraseña')
        
        // Mostrar mensaje según el rol
        let mensaje = ''
        if (result.rol === 'alumno') {
          mensaje = '⚠️ Has iniciado sesión con tu matrícula como contraseña.\n\nSe ha enviado un correo a tu cuenta institucional para cambiar tu contraseña.'
        } else if (result.rol === 'docente') {
          mensaje = '⚠️ Has iniciado sesión con tu clave como contraseña.\n\nSe ha enviado un correo a tu cuenta institucional para cambiar tu contraseña.'
        } else if (result.rol === 'admin') {
          mensaje = '⚠️ Has iniciado sesión con tu clave de empleado como contraseña.\n\nSe ha enviado un correo a tu cuenta institucional para cambiar tu contraseña.'
        }
        
        alert(mensaje)
        setLoading(false)
        return
      }
      
      // Redirigir según el rol
      if (result.rol === 'admin') {
        console.log('👑 Redirigiendo a dashboard administrador')
        navigate('/Admin', { replace: true })
      } else if (result.rol === 'docente') {
        console.log('👨‍🏫 Redirigiendo a dashboard docente')
        navigate('/Docente', { replace: true })
      } else if (result.rol === 'alumno') {
        console.log('👨‍🎓 Redirigiendo a dashboard alumno')
        navigate('/Alumno', { replace: true })
      }
      
    } catch (error) {
      console.error('💥 Error inesperado:', error)
      setErrors(prev => ({ 
        ...prev, 
        general: 'Error de conexión. Intenta nuevamente.' 
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      {/* PANEL IZQUIERDO */}
      <div className="form-panel">
        <div className="form-header">
          <h1 className="form-title">Bienvenido</h1>
          <p className="form-sub">Ingresa a tu cuenta para continuar.</p>
        </div>

        {/* Error general */}
        {errors.general && (
          <div className="error-general">
            {errors.general}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>

          {/* Matrícula / Clave */}
          <div className="field">
            <label htmlFor="matricula">Matrícula / Clave</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 00-16 0"/>
              </svg>

              <input
                id="matricula"
                type="text"
                placeholder="Ej. TIC-310000, ADMN000000 o 123456"
                autoComplete="username"
                value={matricula}
                onChange={e => {
                  setMatricula(e.target.value)
                  validarMatricula(e.target.value)
                }}
              />
            </div>
            {errors.matricula && (
              <span className="field-error">{errors.matricula}</span>
            )}
          </div>

          {/* Contraseña */}
          <div className="field">
            <label htmlFor="pwd">Contraseña</label>
            <div className="input-wrap">
              <svg className="input-icon" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input 
                id="pwd" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                className="pw-input"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  validarPassword(e.target.value)
                }}
              />
              <button 
                type="button" 
                className="pw-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="3" y1="3" x2="21" y2="21"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          <div className="extras">
            <a className="forgot">¿Olvidaste tu contraseña?</a>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>

        </form>

        <div className="divider"></div>
        <p className="footer">¿Necesitas ayuda? <a>Soporte UTN</a></p>
      </div>

      {/* PANEL DERECHO */}
      <div className="visual-panel">
        <div className="visual-bg-glow"></div>
        <div className="visual-accent-circle"></div>
        
        <div className="visual-top">
          <div className="visual-logo">
            <div className="visual-logo-icon">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div className="visual-logo-name">Aula<span>UTN</span></div>
          </div>
        </div>

        <div className="visual-middle">
          <div className="visual-heading">Espacio Digital <em>de Aprendizaje</em></div>
          <p className="visual-sub">
            Plataforma centralizada en material didactico, actividades y seguimiento académico para la comunidad UTN.
          </p>
        </div>

        <div className="visual-bottom">
          <p className="visual-tagline"> Universidad Tecnológica de Nayarit </p>
        </div>
      </div>
    </div>
  )
}