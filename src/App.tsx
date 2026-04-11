import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import DashboardDocente from './pages/DashboardDocente';
import DashboardAlumnos from './pages/DashboardAlumnos';
import Sitemap from './pages/SiteMap';
import CambiarPassword from './pages/CambiarPassword';
import Unauthorized from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import PanelMateria from './pages/PanelMateria'
import GrupoPage from './pages/Docente/GrupoPage'


function App() {
  return (
    <Router basename="/">
      <Routes>
        {/* RUTAS PÚBLICAS (sin protección)  */}
        <Route path="/login" element={<Login />} />
        <Route path="/cambiar-password" element={<CambiarPassword />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Docente */}
        <Route 
          path="/Docente/*" 
          element={
            <ProtectedRoute allowedRoles={['docente']}>
              <DashboardDocente />
              <Route path="/Docente/grupo/:id" element={<GrupoPage />} />
            </ProtectedRoute>
          } 
        />
        
        {/* Alumno */}
        <Route 
          path="/Alumno/*" 
          element={
            <ProtectedRoute allowedRoles={['alumno']}>
              <DashboardAlumnos />
            </ProtectedRoute>
          } 
        />
       
       {/* Panel Materia */ } 
       <Route 
         path="/Alumno/materia/:id" 
         element={
           <ProtectedRoute allowedRoles={['alumno']}>
             <PanelMateria />
           </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/sitemap" replace />} />
      </Routes>
    </Router>
  );
}

export default App;