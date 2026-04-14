import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import DashboardDocente from './pages/DashboardDocente';
import DashboardAlumnos from './pages/DashboardAlumnos';
import DashboardAdmin from './pages/DashboardAdmin'; // Importar el DashboardAdmin
import Sitemap from './pages/SiteMap';
import CambiarPassword from './pages/CambiarPassword';
import Unauthorized from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import PanelMateria from './pages/PanelMateria';
import GrupoPage from './pages/Docente/GrupoPage';
import MateriaPage from './pages/Alumno/MateriaPage';
import TomarExamen from './pages/Alumno/TomarExamen';

function App() {
  return (
    <Router basename="/">
      <Routes>
        {/* ========== RUTAS PÚBLICAS ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/cambiar-password" element={<CambiarPassword />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ========== RUTAS DE ADMINISTRADOR ========== */}
        <Route 
          path="/Admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />

        {/* ========== RUTAS DE DOCENTE ========== */}
        <Route 
          path="/Docente" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <DashboardDocente />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Docente/grupo/:id" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <GrupoPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== RUTAS DE ALUMNO ========== */}
        <Route 
          path="/Alumno" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <DashboardAlumnos />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Alumno/materia/:id" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <MateriaPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Alumno/examen/:id" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <TomarExamen />
            </ProtectedRoute>
          } 
        />

        {/* NOTA: Si PanelMateria es diferente a MateriaPage, mantenlo, sino usa solo MateriaPage */}
        <Route 
          path="/Alumno/panel-materia/:id" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <PanelMateria />
            </ProtectedRoute>
          } 
        />

        {/* ========== RUTA 404 ========== */}
        <Route path="*" element={<Navigate to="/sitemap" replace />} />
      </Routes>
    </Router>
  );
}

export default App;