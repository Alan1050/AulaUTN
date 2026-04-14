import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSesion, requiereCambioPassword, logout } from '../lib/auth';

export function AuthLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [userRole, setUserRole] = useState<'alumno' | 'docente' |  'admin' | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar sesión al cargar el layout
    const verificarSesion = () => {
      const sesion = getSesion();
      
      if (!sesion) {
        setIsAuthenticated(false);
        setNeedsPasswordChange(false);
        setUserRole(null);
      } else {
        setIsAuthenticated(true);
        setNeedsPasswordChange(requiereCambioPassword());
        setUserRole(sesion.rol);
      }
      
      setLoading(false);
    };
    
    verificarSesion();
    
    // Escuchar cambios en localStorage (por si se cierra sesión en otra pestaña)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aula_token') {
        verificarSesion();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  // No autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requiere cambio de contraseña
  if (needsPasswordChange) {
    return (
      <div className="password-change-required">
        <div className="warning-card">
          <h2>⚠️ Cambio de Contraseña Requerido</h2>
          <p>
            Has iniciado sesión con tu {userRole === 'alumno' ? 'matrícula' : 'clave'} como contraseña.
          </p>
          <p>
            Por seguridad, debes cambiar tu contraseña antes de continuar.
          </p>
          <p>
            📧 Hemos enviado un enlace a tu correo electrónico para realizar el cambio.
          </p>
          <button onClick={() => logout()} className="btn-primary">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Autenticado correctamente
  return <Outlet />;
}