// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { getSesion, requiereCambioPassword } from '../lib/auth'

export function ProtectedRoute({ children, allowedRoles }: { 
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const sesion = getSesion()
  
  // Caso 1: No hay sesión
  if (!sesion) {
    return <Navigate to="/login" replace />
  }
  
  // Caso 2: Requiere cambio de contraseña (contraseña = matrícula/clave)
  if (requiereCambioPassword()) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          padding: '30px',
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#dc2626' }}>⚠️ Acceso Bloqueado</h2>
          <p>
            Has iniciado sesión con tu {sesion.rol === 'alumno' ? 'matrícula' : 'clave'} como contraseña.
          </p>
          <p>
            Por seguridad, <strong>debes cambiar tu contraseña</strong> antes de acceder al sistema.
          </p>
          <p>
            📧 Hemos enviado un enlace a tu correo electrónico para realizar el cambio.
          </p>
          <button 
            onClick={() => window.location.href = 'mailto:'}
            style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Revisar mi correo
          </button>
        </div>
      </div>
    )
  }
  
  // Caso 3: Rol no autorizado
  if (!allowedRoles.includes(sesion.rol)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  // Caso 4: Todo correcto
  return children
}