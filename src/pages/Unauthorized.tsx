import { useNavigate } from 'react-router-dom';
import { logout, getSesion } from '../lib/auth';

export default function Unauthorized() {
  const navigate = useNavigate();
  const sesion = getSesion();

  const handleGoToDashboard = () => {
    if (sesion?.rol === 'docente') {
      navigate('/Docente');
    } else if (sesion?.rol === 'alumno') {
      navigate('/Alumno');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #006d0b 0%, #abf5a6 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
        <h2 style={{ color: '#dc2626', marginBottom: '15px' }}>Acceso No Autorizado</h2>
        <p style={{ color: '#6b7280', marginBottom: '25px', lineHeight: '1.6' }}>
          No tienes permisos para acceder a esta página.
          {sesion && (
            <br />
          )}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={handleGoToDashboard}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Ir a mi dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}