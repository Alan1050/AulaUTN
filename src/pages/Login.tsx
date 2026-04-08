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
   // ✅ Estado de carga

  // ── Estado de errores (uno por campo) ────────────────────────
  const [errors, setErrors] = useState({
    matricula: '',
    password:  '',
    general: '' // ✅ Error general
  })

  // ── Validación de matrícula ───────────────────────────────────
  const validarMatricula = (valor: string) => {
    let msg = ''

    if (valor.length === 0) {
      msg = 'La matrícula es requerida'
    } else if (/^TIC-/.test(valor)) {
      // 👨‍🎓 Es alumno — valida formato TIC-XXXXXX
      if (!/^TIC-\d{6}$/.test(valor)) {
        msg = 'Formato de alumno inválido. Ej: TIC-310000'
      }
    } else if (/^\d/.test(valor)) {
      // 👨‍🏫 Es maestro — valida que sean solo números
      if (!/^\d+$/.test(valor)) {
        msg = 'La clave de maestro solo debe contener números'
      }
    } else if(!/^TIC-/.test(valor)) {
      msg = 'Solo se registraron alumnos con matricula TIC-310000'
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

  // ── Submit MODIFICADO con logs ────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar error general
    setErrors(prev => ({ ...prev, general: '' }))

    // Validaciones
    validarMatricula(matricula)
    validarPassword(password)
    const hayErrores = !matricula || !password || errors.matricula || errors.password
    if (hayErrores) {
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
      
      if ('requiereCambioPassword' in result && result.requiereCambioPassword) {
        console.log('⚠️ Usuario requiere cambio de contraseña')
        alert('⚠️ Has iniciado sesión con tu matrícula/clave como contraseña.\n\nSe ha enviado un correo para cambiar tu contraseña.')
        // Opcional: cerrar sesión o mostrar modal
        setLoading(false)
        return
      }
      
      // Redirigir según el rol
      if (result.rol === 'docente') {
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
                placeholder="Ej. TIC-000000"
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
                    <line x1="3" y1="3" x2="21" y2="21"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
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
              <svg viewBox="0 0 24 24">
                <path d="M12 2L22 7L12 12L2 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <div className="visual-logo-name">Aula<span>UTN</span></div>
          </div>
        </div>

        <div className="visual-middle">
          <div className="visual-heading">Espacio Digital <em>de Aprendizaje</em></div>
          <p className="visual-sub">
            Plataforma centralizada en material didactico, actividades y seguimiento académico para la comunidad UTN. </p>
        </div>

        <div className="visual-bottom">
          <p className="visual-tagline"> Universidad Tecnológica de Nayarit </p>
        </div>
      </div>
    </div>
  )
}