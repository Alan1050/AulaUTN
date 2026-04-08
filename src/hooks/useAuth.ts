import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSesion, requiereCambioPassword, logout, type UsuarioSesion } from '../lib/auth';

export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarSesion = () => {
      const sesion = getSesion();
      setUsuario(sesion);
      setRequiresPasswordChange(requiereCambioPassword());
      setLoading(false);
    };

    cargarSesion();

    // Intervalo para verificar expiración de sesión (cada minuto)
    const interval = setInterval(() => {
      const sesion = getSesion();
      if (!sesion && usuario) {
        // Sesión expirada
        logout();
        setUsuario(null);
        navigate('/login');
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [navigate, usuario]);

  const verificarAcceso = (rolesPermitidos: ('alumno' | 'docente')[]): boolean => {
    if (!usuario) return false;
    if (requiresPasswordChange) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  return {
    usuario,
    loading,
    requiresPasswordChange,
    verificarAcceso,
    isAuthenticated: !!usuario && !requiresPasswordChange,
    isDocente: usuario?.rol === 'docente' && !requiresPasswordChange,
    isAlumno: usuario?.rol === 'alumno' && !requiresPasswordChange,
  };
}