import './DashboardAlumno.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  obtenerInfoAlumno, 
  obtenerMateriasAlumno, 
  obtenerEstadisticasAlumno, 
  obtenerAvisosRecientes,
  formatTiempoRelativo 
} from '../lib/alumnoQueries'
import type { MateriaAlumno, AvisoReciente, EstadisticasAlumno } from '../lib/alumnoQueries'
import { logout } from '../lib/auth'

export default function DashboardAlumno() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('inicio')
  const [materiasOpen, setMateriasOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alumnoInfo, setAlumnoInfo] = useState<{ 
    nombre: string; 
    apellidoPaterno: string; 
    matricula: string;
    cuatrimestre?: string;
  } | null>(null)
  const [materias, setMaterias] = useState<MateriaAlumno[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasAlumno>({
    materias_activas: 0,
    material_nuevo: 0
  })
  const [avisos, setAvisos] = useState<AvisoReciente[]>([])

  // Cargar datos del alumno
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      
      try {
        // Obtener información del alumno
        const info = await obtenerInfoAlumno()
        if (info) {
          setAlumnoInfo({
            nombre: info.nombre,
            apellidoPaterno: info.apellidoPaterno,
            matricula: info.matricula
          })
        }
        
        // Obtener materias
        const materiasData = await obtenerMateriasAlumno()
        setMaterias(materiasData)
        
        // Obtener estadísticas
        const stats = await obtenerEstadisticasAlumno()
        setEstadisticas(stats)
        
        // Obtener avisos recientes
        const avisosData = await obtenerAvisosRecientes(5)
        setAvisos(avisosData)
        
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    cargarDatos()
  }, [])

  // Manejar cierre de sesión
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Navega a la página de la materia
  const irAMateria = (materiaId: number, materiaNombre: string) => {
    navigate(`/Alumno/materia/${materiaId}`, { state: { materiaNombre, materiaId } })
  }

  // Obtener iniciales del nombre para el avatar
  const getInitials = () => {
    if (!alumnoInfo) return '??'
    const nombreInicial = alumnoInfo.nombre ? alumnoInfo.nombre.charAt(0).toUpperCase() : ''
    const apellidoInicial = alumnoInfo.apellidoPaterno ? alumnoInfo.apellidoPaterno.charAt(0).toUpperCase() : ''
    return `${nombreInicial}${apellidoInicial}`
  }

  // Obtener nombre para el saludo
  const getNombre = () => {
    if (!alumnoInfo) return 'Alumno'
    return alumnoInfo.nombre
  }

  // Obtener matrícula
  const getMatricula = () => {
    if (!alumnoInfo) return 'XXX-000000'
    return alumnoInfo.matricula
  }

  // Obtener cuatrimestre (puedes calcularlo o obtenerlo de algún lugar)
  const getCuatrimestre = () => {
    // Si tienes información del cuatrimestre en algún lado, puedes obtenerla
    // Por ahora, mostramos algo genérico o de la primera materia
    if (materias.length > 0 && materias[0].cuatrimestre) {
      return materias[0].cuatrimestre
    }
    return 'En curso'
  }

  // Obtener ícono según tipo de material
  const getAvisoIcon = (tipo: string) => {
    switch(tipo) {
      case 'tarea': return '📝'
      case 'examen': return '📋'
      case 'enlace': return '🔗'
      default: return '📄'
    }
  }

  // Obtener clase de color según tipo
  const getAvisoColorClass = (tipo: string) => {
    switch(tipo) {
      case 'tarea': return 'warn'
      case 'examen': return 'danger'
      default: return 'info'
    }
  }

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                <path d="M12 3L22 9L12 15L2 9L12 3Z"/>
                <path d="M6 11.5V17c0 0 2.5 2.5 6 2.5s6-2.5 6-2.5V11.5"/>
                <line x1="22" y1="9" x2="22" y2="14"/>
              </svg>
            </div>
            <span className="sb-logo-name">Aula<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">{getInitials()}</div>
          <div className="sb-info">
            <div className="sb-uname">
              {alumnoInfo ? `${alumnoInfo.nombre} ${alumnoInfo.apellidoPaterno}` : 'Alumno'}
            </div>
            <div className="sb-uid">{getMatricula()}</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div
            className={`nav-item ${activeNav === 'inicio' ? 'active' : ''}`}
            onClick={() => setActiveNav('inicio')}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          {/* Acordeon materias */}
          <div>
            <div
              className={`nav-item ${activeNav === 'materias' ? 'active' : ''}`}
              onClick={() => {
              if (collapsed) {
                     setCollapsed(false)
                     setMateriasOpen(true)
              } else {
                     setMateriasOpen(!materiasOpen)
                    }
                     setActiveNav('materias')
                    }}
              style={{ justifyContent: 'space-between', paddingRight: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <span className="nav-label">Materias</span>
              </div>
              <svg className={`chevron ${materiasOpen ? 'open' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* Materias sidebar */}
            {materiasOpen && (
              <div className="accordion-content">
                {materias.length > 0 ? (
                  materias.map((materia) => (
                    <div 
                      key={materia.id}
                      className="nav-item course-item" 
                      onClick={() => irAMateria(materia.id, materia.materia)}
                    >
                      <div className="course-avatar" style={{ backgroundColor: 'rgba(229, 198, 135, 0.15)' }}>
                        {materia.materia.charAt(0).toUpperCase()}
                      </div>
                      <span className="course-title">{materia.materia}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-materias-msg">No hay materias asignadas</div>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="main">

        <header className="topbar">
          <h1 className="topbar-title">Hola, {getNombre()}</h1>
          <span className="topbar-date">{getCuatrimestre()}</span>
        </header>

        <div className="content">

          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Materias activas</p>
              <p className="stat-val">{estadisticas.materias_activas}</p>
              <p className="stat-sub">Este cuatrimestre</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Material disponible</p>
              <p className="stat-val">{estadisticas.material_nuevo}</p>
              <p className="stat-sub">Nuevos esta semana</p>
            </div>
          </div>

          <div className="two-col">

            {/* Materias contenido principal */}
            <section>
              <p className="section-title">Mis materias</p>
              <div className="materias-grid">
                {materias.length > 0 ? (
                  materias.map((materia, index) => (
                    <div 
                      key={materia.id}
                      className="materia-card" 
                      onClick={() => irAMateria(materia.id, materia.materia)}
                    >
                      <p className="mat-name">{materia.materia}</p>
                      <p className="mat-desc">{materia.nombre}</p>
                      {materia.cuatrimestre && (
                        <p className="mat-cuatrimestre">{materia.cuatrimestre}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-materias-card">
                    <p>No tienes materias asignadas</p>
                    <p className="no-materias-sub">Contacta al administrador</p>
                  </div>
                )}
              </div>
            </section>

            {/* Avisos */}
            <section>
              <p className="section-title">Avisos recientes</p>
              <div className="avisos-list">
                {avisos.length > 0 ? (
                  avisos.map((aviso) => (
                    <div key={aviso.id} className="aviso">
                      <div className={`aviso-dot ${getAvisoColorClass(aviso.tipo)}`}>
                        {getAvisoIcon(aviso.tipo)}
                      </div>
                      <div>
                        <p className="aviso-text">
                          <strong>{aviso.materia_nombre}:</strong> {aviso.titulo}
                        </p>
                        {aviso.descripcion && (
                          <p className="aviso-desc">{aviso.descripcion}</p>
                        )}
                        <p className="aviso-time">{formatTiempoRelativo(aviso.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-avisos">
                    <p>No hay avisos recientes</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}