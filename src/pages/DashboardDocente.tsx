import './DashboardDocente.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  obtenerGruposDocente, 
  obtenerEstadisticasDocente, 
  obtenerInfoDocente,
  obtenerEstadisticasAvanzadasDocente 
} from '../lib/docenteQueries'
import type { GrupoDocente, EstadisticasDocente } from '../lib/docenteQueries'
import { logout } from '../lib/auth'

export default function DashboardDocente() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('inicio')
  const [gruposOpen, setGruposOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docenteInfo, setDocenteInfo] = useState<{ nombre: string; apellidoPaterno: string } | null>(null)
  const [grupos, setGrupos] = useState<GrupoDocente[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasDocente>({
    grupos_activos: 0,
    total_alumnos: 0,
    materiales_subidos: 0
  })
  
  // Estado para estadísticas avanzadas
  const [estadisticasAvanzadas, setEstadisticasAvanzadas] = useState({
    total_preguntas: 0,
    total_examenes: 0,
    total_descargas: 0
  })
  
  const navigate = useNavigate()

  // Cargar datos del docente
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      
      try {
        // Obtener información del docente
        const info = await obtenerInfoDocente()
        if (info) {
          setDocenteInfo({
            nombre: info.nombre,
            apellidoPaterno: info.apellidoPaterno
          })
        }
        
        // Obtener grupos
        const gruposData = await obtenerGruposDocente()
        setGrupos(gruposData)
        
        // Obtener estadísticas básicas
        const stats = await obtenerEstadisticasDocente()
        setEstadisticas(stats)
        
        // Obtener estadísticas avanzadas
        const statsAvanzadas = await obtenerEstadisticasAvanzadasDocente()
        if (statsAvanzadas) {
          setEstadisticasAvanzadas(statsAvanzadas)
        }
        
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

  // Navegar a un grupo específico
  const handleGrupoClick = (grupoId: number, grupoNombre: string, materia: string) => {
    navigate(`/Docente/grupo/${grupoId}`, { 
      state: { 
        grupoNombre, 
        grupoId,
        materia 
      } 
    })
  }

  // Obtener iniciales del nombre para el avatar
  const getInitials = () => {
    if (!docenteInfo) return '??'
    const nombreInicial = docenteInfo.nombre ? docenteInfo.nombre.charAt(0).toUpperCase() : ''
    const apellidoInicial = docenteInfo.apellidoPaterno ? docenteInfo.apellidoPaterno.charAt(0).toUpperCase() : ''
    return `${nombreInicial}${apellidoInicial}`
  }

  // Obtener nombre completo para el saludo
  const getNombreCompleto = () => {
    if (!docenteInfo) return 'Docente'
    return docenteInfo.nombre
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
      {/* SIDEBAR */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sb-top">
          <button className="toggle-btn" onClick={() => setCollapsed(v => !v)}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                <path d="M12 3L22 9L12 15L2 9L12 3Z"/><path d="M6 11.5V17c0 0 2.5 2.5 6 2.5s6-2.5 6-2.5V11.5"/><line x1="22" y1="9" x2="22" y2="14"/>
              </svg>
            </div>
            <span className="sb-logo-name">Aula<span>UTN</span></span>
          </div>
        </div>

        <div className="sb-user">
          <div className="sb-avatar">{getInitials()}</div>
          <div className="sb-info">
            <div className="sb-uname">
              {docenteInfo ? `Mtro. ${docenteInfo.nombre} ${docenteInfo.apellidoPaterno}` : 'Docente'}
            </div>
            <div className="sb-uid">Docente</div>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Principal</p>

          <div 
            className={`nav-item ${activeNav === 'inicio' ? 'active' : ''}`} 
            onClick={() => setActiveNav('inicio')}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="nav-label">Inicio</span>
          </div>

          {/* Acordeon de Grupos */}
          <div>
            <div 
              className={`nav-item ${activeNav === 'grupos' ? 'active' : ''}`} 
              onClick={() => {
              if (collapsed) {
                      setCollapsed(false)
                      setGruposOpen(true)
              } else {
                     setGruposOpen(!gruposOpen)
                     }
                     setActiveNav('grupos')
                    }}
              style={{ justifyContent: 'space-between', paddingRight: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <span className="nav-label">Grupos</span>
              </div>
              <svg className={`chevron ${gruposOpen ? 'open' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {gruposOpen && (
              <div className="accordion-content">
                {grupos.length > 0 ? (
                  grupos.map((grupo) => (
                    <div 
                      key={grupo.id}
                      className="nav-item course-item" 
                      onClick={() => handleGrupoClick(grupo.id, grupo.nombre, grupo.materia)}
                    >
                      <div className="course-avatar" style={{backgroundColor: 'rgba(229, 198, 135, 0.15)'}}>
                        {grupo.nombre.replace(/[^0-9]/g, '').slice(-2) || 'G'}
                      </div>
                      <span className="course-title">{grupo.nombre}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-grupos-msg">No hay grupos asignados</div>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="sb-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">
        <header className="topbar">
          <h1 className="topbar-title">Hola, {getNombreCompleto()}</h1>
        </header>

        <div className="content">
          {/* Primera fila de estadísticas - Básicas */}
          <div className="stats-row">
            <div className="stat-card">
              <p className="stat-label">Grupos activos</p>
              <p className="stat-val">{estadisticas.grupos_activos}</p>
              <p className="stat-sub">Este cuatrimestre</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total alumnos</p>
              <p className="stat-val">{estadisticas.total_alumnos}</p>
              <p className="stat-sub">Inscritos</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Material subido</p>
              <p className="stat-val">{estadisticas.materiales_subidos}</p>
              <p className="stat-sub">Recursos publicados</p>
            </div>
          </div>

          {/* Segunda fila de estadísticas - Avanzadas */}
          <div className="stats-row-avanzadas">
            <div className="stat-card avanzada">
              <div className="stat-icon">📝</div>
              <div>
                <p className="stat-label">Banco de preguntas</p>
                <p className="stat-val">{estadisticasAvanzadas.total_preguntas}</p>
                <p className="stat-sub">Preguntas creadas</p>
              </div>
            </div>
            <div className="stat-card avanzada">
              <div className="stat-icon">📋</div>
              <div>
                <p className="stat-label">Exámenes</p>
                <p className="stat-val">{estadisticasAvanzadas.total_examenes}</p>
                <p className="stat-sub">Evaluaciones creadas</p>
              </div>
            </div>
            <div className="stat-card avanzada">
              <div className="stat-icon">📥</div>
              <div>
                <p className="stat-label">Descargas</p>
                <p className="stat-val">{estadisticasAvanzadas.total_descargas}</p>
                <p className="stat-sub">Total de descargas</p>
              </div>
            </div>
          </div>

          <p className="section-title">Mis grupos</p>
          <div className="grupos-grid">
            {grupos.length > 0 ? (
              grupos.map((grupo, index) => (
                <div 
                  key={grupo.id}
                  className={`grupo-card c${(index % 3) + 1}`} 
                  onClick={() => handleGrupoClick(grupo.id, grupo.nombre, grupo.materia)}
                >
                  <p className="gc-nombre">Grupo {grupo.nombre}</p>
                  <p className="gc-materia">{grupo.materia}</p>
                  {grupo.cuatrimestre && (
                    <p className="gc-cuatrimestre">{grupo.cuatrimestre}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="no-grupos-card">
                <p>No tienes grupos asignados</p>
                <p className="no-grupos-sub">El Administrador de carrera te asignara uno pronto</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}