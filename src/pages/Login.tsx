import './Login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'


// Las partículas se generan fuera porque son estáticas (no cambian nunca)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 12}s`,
  duration: `${8 + Math.random() * 10}s`,
  size: `${1 + Math.random() * 2}px`,
}))

export default function Login() {
  const navigate = useNavigate()

  // ── Estado de los campos ──────────────────────────────────────
  const [matricula, setMatricula] = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading] = useState(false) // ✅ Estado de carga

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

      <div className="bg-canvas">
        <div className="bg-grid" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="particles">
          {PARTICLES.map(p => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                bottom: '-4px',
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      </div>

      <div className="login-card">

        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L22 9L12 15L2 9L12 3Z" />
              <path d="M6 11.5V17C6 17 8.5 19.5 12 19.5C15.5 19.5 18 17 18 17V11.5" />
              <line x1="22" y1="9" x2="22" y2="14" />
            </svg>
          </div>
          <div className="brand-name">Aula<span>UTN</span></div>
          <div className="brand-tagline">Sistema de Recursos Digitales</div>
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
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, stroke: 'rgba(245,240,232,0.3)', fill: 'none', strokeWidth: 1.5, pointerEvents: 'none' }}
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            {errors.matricula && (
              <span className="field-error">{errors.matricula}</span>
            )}
          </div>

          {/* Contraseña */}
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrap">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  validarPassword(e.target.value)
                }}
              />
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, stroke: 'rgba(245,240,232,0.3)', fill: 'none', strokeWidth: 1.5, pointerEvents: 'none' }}
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            </div>
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>

        </form>

        <div className="card-divider" />

        <p className="card-footer">
          ¿Problemas para Acceder?&nbsp;
          <a href="#">Contactar a Servicios Informáticos</a>
        </p>
      </div>

    </div>
  )
}